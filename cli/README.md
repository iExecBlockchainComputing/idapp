# idapp-sconifier-cli

# Use it as a CLI (Globally)

### Install

```bash
cd cli && npm i -g idapp
```

## Commands

### init

```bash
idapp init
```

### test

```bash
idapp test
```

You can add `--docker` option if you want to test as close as possible to the workerpool environment

```bash
idapp test --docker
```

### deploy

This command, will ask you to choose if you want to deploy in debug or prod.

```bash
idapp deploy
```

If you already know the target environment you can set `--prod` or `--debug` option to go faster

```bash
idapp deploy --debug
```

or

```bash
idapp deploy --prod
```

# Use it locally

## Commands

### --help

```bash
npm start
```

### init

```bash
npm run init
```

This will create a new `build` folder,
ask you a few questions,
init an npm project,
create some `./input` and `./output` folders, etc.

### test-idapp

```bash
npm run test-idapp
```

### test-idapp --docker

You need to log in to docker before.

```bash
npm run test-idapp:docker
```

### deploy

You need to log in to docker before.

```bash
npm run deploy
```

## TODO

- [ ] use dockerode lib => npm i dockerode (may be)
- [ ] build iDapp sconification service & its API
- [ ] publish App Contract
- [ ] new command to publish order
- [ ] Be sure to use Docker username and not docker email to tag Docker image
- [ ] Have a global progress bar (sconification process when calling API may take 6-7min)
