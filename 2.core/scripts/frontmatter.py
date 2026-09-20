"""Safe YAML reader and strict schema for existing Core record metadata."""
from datetime import date
import re
from typing import Literal

import yaml
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator


class RecordLoader(yaml.SafeLoader):
    # Keep dates as strings and use only true/false booleans, as in YAML 1.2.
    yaml_implicit_resolvers = {
        key: [(tag, pattern) for tag, pattern in values
              if tag not in ('tag:yaml.org,2002:timestamp', 'tag:yaml.org,2002:bool')]
        for key, values in yaml.SafeLoader.yaml_implicit_resolvers.items()
    }

    def compose_node(self, parent, index):
        if self.check_event(yaml.AliasEvent):
            raise ValueError('YAML aliases are not supported in frontmatter')
        return super().compose_node(parent, index)

    def construct_mapping(self, node, deep=False):
        result = {}
        for key_node, value_node in node.value:
            key = self.construct_object(key_node, deep=deep)
            if not isinstance(key, str) or key == '<<':
                raise ValueError('Frontmatter keys must be strings; merge keys are not supported')
            if key in result:
                raise ValueError(f'Duplicate frontmatter key: {key}')
            result[key] = self.construct_object(value_node, deep=deep)
        return result


RecordLoader.add_implicit_resolver('tag:yaml.org,2002:bool', re.compile(r'^(?:true|false)$'), list('tf'))


def read_frontmatter(text):
    if not text.startswith(('---\n', '---\r\n')):
        return None
    match = re.match(r'\A---\r?\n(.*?)\r?\n---(?:\r?\n|$)', text, re.S)
    if not match:
        raise ValueError('Unclosed YAML frontmatter')
    try:
        result = yaml.load(match[1], Loader=RecordLoader)
    except (yaml.YAMLError, RecursionError) as error:
        raise ValueError('Invalid YAML frontmatter') from error
    if not isinstance(result, dict):
        raise ValueError('Frontmatter must be a mapping')
    return result


class RecordMetadata(BaseModel):
    model_config = ConfigDict(strict=True, extra='forbid')
    title: str = Field(min_length=1)
    type: Literal['knowledge', 'decision', 'source-note', 'memory', 'theme', 'index']
    updated: str
    record_id: str = Field(default=None, pattern=r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
    aliases: list[str] = Field(default_factory=list)
    dashboard: bool = False
    slug: str = Field(default=None, pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$')

    @field_validator('title')
    @classmethod
    def nonblank(cls, value):
        if not value.strip():
            raise ValueError('must not be blank')
        return value

    @field_validator('updated')
    @classmethod
    def calendar_date(cls, value):
        if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', value):
            raise ValueError('expected YYYY-MM-DD')
        date.fromisoformat(value)
        return value

    @field_validator('aliases')
    @classmethod
    def alias_names(cls, values):
        if any(not value.strip() for value in values) or len(values) != len(set(values)):
            raise ValueError('aliases must be nonblank and unique')
        return values


def validate_frontmatter(text, allowed_types):
    try:
        data = read_frontmatter(text)
        if data is None:
            return ['Missing YAML frontmatter']
        record = RecordMetadata.model_validate(data)
        if record.type not in allowed_types:
            return [f'type must be one of: {", ".join(sorted(allowed_types))}']
        if 'slug' in data and record.type != 'theme':
            return ['slug is only supported on theme records']
        return []
    except ValidationError as error:
        # Report fields and reasons without echoing potentially private values.
        return [f'{".".join(map(str, item["loc"]))}: {item["msg"]}'
                for item in error.errors(include_input=False, include_url=False)]
    except ValueError as error:
        return [str(error)]
