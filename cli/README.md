# idapp-sconifier > CLI

This CLI provides an interface to guide you through different steps:
 - Create a simple JavaScript app with the necessary structure to run on a decentralized worker,
 - Test it locally, with or without Docker,
 - Build a Docker image and push it to Docker Hub,
 - Sconify it and get a TEE-compatible Docker image.

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

You can add `--docker` option if you want to test as close as possible to the
workerpool environment

```bash
idapp test --docker
```

### deploy

This command, will ask you to choose if you want to deploy in debug or prod.

```bash
idapp deploy
```

If you already know the target environment you can set `--prod` or `--debug`
option to go faster

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

This will create a new `build` folder, ask you a few questions, init an npm
project, create some `./input` and `./output` folders.

### test-idapp

```bash
npm run test-idapp
npm run test-idapp universe
```

### test-idapp --docker

```bash
npm run test-idapp:docker
npm run test-idapp:docker universe
```

### deploy

You need to log in to docker before.

```bash
npm run deploy
```

### sconify

This will take a public Docker Hub image and wrap it into a TEE-compatible image via Scone.

```bash
npm run sconify
```

## TODO

- [X] use dockerode lib => npm i dockerode (may be) -> Done in API
- [X] build iDapp sconification service & its API
- [X] publish App Contract
- [ ] new command to publish order
- [X] Be sure to use Docker username and not docker email to tag Docker image (we now ask directly for the username, instead of trying to get it from user locally installed docker)
- [ ] Have a global progress bar (sconification process when calling API may take 6-7min)
- [ ] Test with some fancy dependencies in the idapp (node- gyp stuff?), see how sconification process behaves
- [ ] Once sconified, be able to test the app locally, maybe before deploying the app contract
- [ ] Test with an access to a protected data inside the idapp?
