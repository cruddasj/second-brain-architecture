import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test from "node:test";

async function startProductionServer(port) {
 const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","-p",String(port)],{stdio:["ignore","pipe","pipe"]});
 let output="";
 const ready=new Promise((resolve,reject)=>{const inspect=(chunk)=>{output+=chunk; if (output.includes("Ready")) resolve();}; server.stdout.on("data",inspect); server.stderr.on("data",inspect); server.once("exit",code=>reject(new Error(`Next.js exited before becoming ready (${code}): ${output}`)));});
 await ready;
 return server;
}
