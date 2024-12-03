# iExec iApp > CLI

This CLI provides an interface to guide you through different steps:

- Create a simple JavaScript app with the necessary structure to run on a
  decentralized worker
- Test it locally (with Docker)
- Deploy and sconify your iApp on the iExec protocol

## Prerequisites

- Node.js v18 or higher
- A directory where you want to init your iApp. If not, create a new
  folder. (`iaapp init` will also propose you to do so)
- Docker

## Install

```sh
cd idapp/cli
npm ci
# (don't forget the final '.')
npm i -g .
```

## Commands

### `--help`

Command:

```bash
iapp --help
```

Description: Display help information about the `iapp` CLI and its
available commands and options. This option provides a quick reference guide for
users to understand how to use each command effectively.

### `init`

Command:

```bash
iapp init
```

Description: Initialize the framework with the necessary structure to build your
iexec decentralized application.

---

### `test`

Command:

```bash
iapp test [--args <input>]
```

Description: Test your iApp locally. Optionally, use `--args` to provide input
arguments to your iApp during testing.

---

### `deploy`

Command:

```bash
iapp deploy
```

Description: Deploy your iApp on the iExec protocol in debug mode.

---

### `run`

Command:

```bash
iapp run <iapp-address> [--protectedData <protectedData-address>] [--args <input>]
```

Description: Run your deployed iApp. Provide the address of your iApp
(`<iapp-address>`). Optionally use `--args` to provide input arguments to
your iApp. Optionally, if your iApp is meant to process protected data,
include the `--protectedData` option followed by the address of the protected
data.

## What's next?

To get logs about your running task:

```
iexec task debug <taskId> --logs --chain bellecour

Example:
iexec task debug 0x62ed16ebc52c9437af45f57dc30819254ce391633c090e125253726eb76e07b1 --logs --chain bellecour
```

To get the output of your task:

```
iexec task show <taskId> --download task-result.zip

Example:
iexec task show 0x62ed16ebc52c9437af45f57dc30819254ce391633c090e125253726eb76e07b1 --download task-result.zip
```

Unzip the downloaded file and you will find the output of your task in a
`result.txt` file.
