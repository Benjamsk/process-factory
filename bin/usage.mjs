export function printUsage() {
  process.stderr.write(
    'Usage: process-factory init\n       process-factory new "<title>" ["<prompt>"]\n       process-factory move <process-id> <stage>\n       process-factory show [<process-id>]\n       process-factory answer <process-id> <file>\n       process-factory accept-spec <process-id>\n       process-factory round <process-id>\n       process-factory owner <process-id> "<person>"\n       process-factory approve <process-id> --by "<person>"\n       process-factory respec <process-id>\n       process-factory send-back <process-id> <file>\n       process-factory edit <process-id> <name> <file> --by "<person>"\n       process-factory org init\n       process-factory check\n       process-factory export <process-id> --format html|markdown --link <address>\n       process-factory serve [--port <number>]\n       process-factory dashboard [--port <number>]\n',
  )
  return 1
}
