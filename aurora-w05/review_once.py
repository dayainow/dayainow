"""Explicit model invocation. Consumes the user's Codex usage; never auto-retries."""
import argparse
import json
from pathlib import Path
import engine
import ai_adapter

if __name__=='__main__':
 p=argparse.ArgumentParser(description='Runs one real Codex review. Requires Codex login; consumes usage.')
 p.add_argument('--scenario',choices=['normal','changed','missing'],default='normal')
 p.add_argument('--inputs',help='Optional complete input JSON exported from the app state')
 p.add_argument('--output',required=True,help='New directory for prompt, events and response')
 args=p.parse_args()
 inputs=json.loads(Path(args.inputs).read_text()) if args.inputs else engine.preset(args.scenario)
 result=ai_adapter.run(inputs,args.output)
 print(json.dumps(result,ensure_ascii=False,indent=2))
