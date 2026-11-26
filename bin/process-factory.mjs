#!/usr/bin/env node
import { answerDashboardRequest, dashboardPort } from "./dashboard.mjs"
import { checkDependencies } from "./dependencies.mjs"
import { exportVersion } from "./export.mjs"
import { createOrganisation, initialiseOrganisation, listOrganisations, runStoreCommand } from "./organisation.mjs"
import { answerRequest, serveOnLocalhost, viewPort } from "./reading-view.mjs"
import { installSkill } from "./skill.mjs"
import { acceptSpec, answerProcess, approveDraft, editProcessFile, moveProcess, recordRound, respecProcess, sendBackDraft, setOwner } from "./state-machine.mjs"
import { createProcess, showProcesses } from "./store.mjs"
import { printUsage } from "./usage.mjs"

const given = process.argv.slice(2)
const named = given.length >= 2 && given.at(-2) === "--org"
const organisation = named ? given.at(-1) : undefined
const commandArguments = named ? given.slice(0, -2) : given
if (commandArguments.length === 1 && commandArguments[0] === "init" && !named) process.exitCode = installSkill()
else if ((commandArguments.length === 2 || commandArguments.length === 3) && commandArguments[0] === "new")
  process.exitCode = runStoreCommand(organisation, () => createProcess(commandArguments[1], commandArguments[2]))
else if (commandArguments.length === 3 && commandArguments[0] === "move")
  process.exitCode = runStoreCommand(organisation, () => moveProcess(commandArguments[1], commandArguments[2]))
else if (commandArguments.length === 3 && commandArguments[0] === "answer")
  process.exitCode = runStoreCommand(organisation, () => answerProcess(commandArguments[1], commandArguments[2]))
else if (commandArguments.length === 2 && commandArguments[0] === "accept-spec") process.exitCode = runStoreCommand(organisation, () => acceptSpec(commandArguments[1]))
else if (commandArguments.length === 2 && commandArguments[0] === "round") process.exitCode = runStoreCommand(organisation, () => recordRound(commandArguments[1]))
else if (commandArguments.length === 3 && commandArguments[0] === "owner")
  process.exitCode = runStoreCommand(organisation, () => setOwner(commandArguments[1], commandArguments[2]))
else if (commandArguments.length === 4 && commandArguments[0] === "approve" && commandArguments[2] === "--by")
  process.exitCode = runStoreCommand(organisation, () => approveDraft(commandArguments[1], commandArguments[3]))
else if (commandArguments.length === 2 && commandArguments[0] === "respec") process.exitCode = runStoreCommand(organisation, () => respecProcess(commandArguments[1]))
else if (commandArguments.length === 3 && commandArguments[0] === "send-back")
  process.exitCode = runStoreCommand(organisation, () => sendBackDraft(commandArguments[1], commandArguments[2]))
else if (commandArguments.length === 6 && commandArguments[0] === "edit" && commandArguments[4] === "--by")
  process.exitCode = runStoreCommand(organisation, () => editProcessFile(commandArguments[1], commandArguments[2], commandArguments[3], commandArguments[5]))
else if (commandArguments.length <= 2 && commandArguments[0] === "show") process.exitCode = runStoreCommand(organisation, () => showProcesses(commandArguments[1]))
else if (commandArguments.length === 3 && commandArguments[0] === "org" && commandArguments[1] === "new" && !named) process.exitCode = createOrganisation(commandArguments[2])
else if (commandArguments.length === 2 && commandArguments[0] === "org" && commandArguments[1] === "list" && !named) process.exitCode = listOrganisations()
else if (commandArguments.length === 2 && commandArguments[0] === "org" && commandArguments[1] === "init") process.exitCode = runStoreCommand(organisation, initialiseOrganisation)
else if (commandArguments.length === 1 && commandArguments[0] === "check") process.exitCode = runStoreCommand(organisation, checkDependencies)
else if (commandArguments.length === 6 && commandArguments[0] === "export" && commandArguments[2] === "--format" && commandArguments[4] === "--link")
  process.exitCode = runStoreCommand(organisation, () => exportVersion(commandArguments[1], commandArguments[3], commandArguments[5]))
else if (commandArguments[0] === "serve" && !named && (commandArguments.length === 1 || (commandArguments.length === 3 && commandArguments[1] === "--port")))
  process.exitCode = serveOnLocalhost("Reading view", viewPort, answerRequest, commandArguments[2])
else if (commandArguments[0] === "dashboard" && !named && (commandArguments.length === 1 || (commandArguments.length === 3 && commandArguments[1] === "--port")))
  process.exitCode = serveOnLocalhost("Dashboard", dashboardPort, answerDashboardRequest, commandArguments[2])
else process.exitCode = printUsage()
