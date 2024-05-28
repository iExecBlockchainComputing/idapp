# idapp-sconifier-cli

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
