# idapp hello-world

This project is an iExec decentralized application scaffolded with `idapp init`

## Prerequisites

- `idapp` CLI installed locally
- `docker` installed locally
- [dockerhub](https://hub.docker.com/) account
- ethereum wallet

## Project overview

- [idapp.config.json](./idapp.config.json) configuration file for the `idapp`
  commands
- [src/](./src/) where your code lives when you [develop](#develop)
  your app
- [Dockerfile](./Dockerfile) defines how to build your app docker image
- [input/](./input/) input directory for your [local tests](#test-locally)
- [output/](./output/) output directory for your [local tests](#test-locally)
- [cache/](./cache/) directory contains traces of your past app
  [deployments](#deploy-on-iexec) and [runs](#run-on-iexec)

### Develop

Start hacking in [./src](./src/)

### Test locally

Use the `test` command to run your app locally

```sh
idapp test
```

Check the test output in the [output](./output/) directory

### Deploy on iExec

Use the `deploy` command to deploy your app on the iExec decentralized platform

```sh
idapp deploy
```

### Run on iExec

Use the `run` command to run a deployed app on the iExec decentralized platform

```sh
idapp run <app-address>
```
