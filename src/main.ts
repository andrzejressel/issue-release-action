import * as core from '@actions/core'
import {exec} from '@actions/exec'
import {context, GitHub} from '@actions/github'

const VERSION_TAG = 'version'

enum Mode {
  INITIAL,
  CANCELED,
  SUCCESS,
  FAILURE
}
declare global {
  interface String {
    toMode(): Mode | undefined
  }
}

String.prototype.toMode = function(): Mode | undefined {
  core.info(`Mode "${this}"`)
  if (this === '') {
    return Mode.INITIAL
  } else if (this === 'Success') {
    return Mode.SUCCESS
  } else if (this === 'Failure') {
    return Mode.FAILURE
  } else if (this === 'Canceled') {
    return Mode.CANCELED
  }
  throw Error(`'${this}' cannot be converted to mode`)
}

async function initial() {
  const token = core.getInput('github-token', {required: true})
  const users = core.getInput('users', {required: true}).split(',')

  const client = new GitHub(token, {})

  const {data: issue} = await client.issues.get(context.issue)

  const issueTitle = issue.title

  const versionRegex = /!release (.*)/
  const match = versionRegex.exec(issueTitle)

  core.info(`Valid users: ${users}`)

  core.info(`Issue title: ${issueTitle}`)

  if (match?.length != 2) {
    core.warning('Issue name does not match. Returning')
    return
  }

  const version = match[1]

  core.info(`Version: ${version}`)

  if (!users.includes(issue.user.login)) {
    core.warning(`User ${issue.user.login} cannot perform deployments`)
    return
  }

  await client.issues.createComment({
    ...context.issue,
    body: 'Starting deployment'
  })

  core.setOutput('version', version)
}

async function success() {
  const token = core.getInput('github-token', {required: true})
  const client = new GitHub(token, {})

  const {data: issue} = await client.issues.get(context.issue)

  await client.issues.createComment({
    ...context.issue,
    body: 'Deployment successful'
  })
  await client.issues.update({...context.issue, state: 'closed'})
}

async function failure() {
  const token = core.getInput('github-token', {required: true})
  const client = new GitHub(token, {})

  const {data: issue} = await client.issues.get(context.issue)

  await client.issues.createComment({
    ...context.issue,
    body: `Deployment failed`
  })
}

async function canceled() {
  const token = core.getInput('github-token', {required: true})
  const client = new GitHub(token, {})

  const {data: issue} = await client.issues.get(context.issue)

  await client.issues.createComment({
    ...context.issue,
    body: `Deployment canceled`
  })
}

async function mainCatching(): Promise<void> {
  try {
    const mode = core.getInput('status', {required: false}).toMode()

    switch (mode) {
      case Mode.INITIAL: {
        await initial()
        break
      }
      case Mode.SUCCESS: {
        await success()
        break
      }
      case Mode.FAILURE: {
        await failure()
        break
      }
      case Mode.CANCELED: {
        await canceled()
        break
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

mainCatching()
