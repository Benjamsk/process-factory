#!/usr/bin/env node
import { answerDashboardRequest, dashboardPort } from "./dashboard.mjs"
import { checkDependencies } from "./dependencies.mjs"
import { exportVersion } from "./export.mjs"
import { initialiseOrganisation } from "./organisation.mjs"
import { answerRequest, serveOnLocalhost, viewPort } from "./reading-view.mjs"
import { installSkill } from "./skill.mjs"
import { acceptSpec, answerProcess, approveDraft, editProcessFile, moveProcess, recordRound, respecProcess, sendBackDraft, setOwner } from "./state-machine.mjs"
import { createProcess, showProcesses } from "./store.mjs"
import { printUsage } from "./usage.mjs"

const commandArguments = process.argv.slice(2)
if (commandArguments.length === 1 && commandArguments[0] === "init") process.exitCode = installSkill()
else if ((commandArguments.length === 2 || commandArguments.length === 3) && commandArguments[0] === "new") process.exitCode = createProcess(commandArguments[1], commandArguments[2])
else if (commandArguments.length === 3 && commandArguments[0] === "move") process.exitCode = moveProcess(commandArguments[1], commandArguments[2])
else if (commandArguments.length === 3 && commandArguments[0] === "answer") process.exitCode = answerProcess(commandArguments[1], commandArguments[2])
else if (commandArguments.length === 2 && commandArguments[0] === "accept-spec") process.exitCode = acceptSpec(commandArguments[1])
else if (commandArguments.length === 2 && commandArguments[0] === "round") process.exitCode = recordRound(commandArguments[1])
else if (commandArguments.length === 3 && commandArguments[0] === "owner") process.exitCode = setOwner(commandArguments[1], commandArguments[2])
else if (commandArguments.length === 4 && commandArguments[0] === "approve" && commandArguments[2] === "--by") process.exitCode = approveDraft(commandArguments[1], commandArguments[3])
else if (commandArguments.length === 2 && commandArguments[0] === "respec") process.exitCode = respecProcess(commandArguments[1])
else if (commandArguments.length === 3 && commandArguments[0] === "send-back") process.exitCode = sendBackDraft(commandArguments[1], commandArguments[2])
else if (commandArguments.length === 6 && commandArguments[0] === "edit" && commandArguments[4] === "--by")
  process.exitCode = editProcessFile(commandArguments[1], commandArguments[2], commandArguments[3], commandArguments[5])
else if (commandArguments.length <= 2 && commandArguments[0] === "show") process.exitCode = showProcesses(commandArguments[1])
else if (commandArguments.length === 2 && commandArguments[0] === "org" && commandArguments[1] === "init") process.exitCode = initialiseOrganisation()
else if (commandArguments.length === 1 && commandArguments[0] === "check") process.exitCode = checkDependencies()
else if (commandArguments.length === 6 && commandArguments[0] === "export" && commandArguments[2] === "--format" && commandArguments[4] === "--link")
  process.exitCode = exportVersion(commandArguments[1], commandArguments[3], commandArguments[5])
else if (commandArguments[0] === "serve" && (commandArguments.length === 1 || (commandArguments.length === 3 && commandArguments[1] === "--port")))
  process.exitCode = serveOnLocalhost("Reading view", viewPort, answerRequest, commandArguments[2])
else if (commandArguments[0] === "dashboard" && (commandArguments.length === 1 || (commandArguments.length === 3 && commandArguments[1] === "--port")))
  process.exitCode = serveOnLocalhost("Dashboard", dashboardPort, answerDashboardRequest, commandArguments[2])
else process.exitCode = printUsage()
