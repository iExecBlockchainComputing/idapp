# Hello World

To get started with the `iapp` CLI and create your "Hello World" application,
follow these steps:

[iapp CLI README](./cli/README.md)

## Architecture of the project

This is a monorepo repository

```
.
├── admin
├── api
├── cli
```

### Simple diagram

![Simple architecture diagram](quick-archi-diagram.png)

### More detailed diagram

![Detailed architecture diagram](archi-diagram.png)

## Done on Azure VM

👉 <https://iexecproject.atlassian.net/wiki/spaces/IP/pages/3302129724/VM+Azure>

## TODO

### CLI

- [ ] CLI work only with node18 but iapp dependency should be installed with
      node14. Not very friendly for builder
- [ ] Test with some fancy dependencies in the iapp (node-gyp stuff?), see how
      sconification process behaves
- [ ] Test with an access to **a protected data** inside the iapp
- [ ] Fix command "$> iapp" to display help
- [ ] Try with node v20 in app. Scone says it should work! (cf. some shared
      emails)
- [ ] New command to publish order? It seems to work without it... (Thanks to
      `iexec app run` magic?)

#### Nice-to-have

- [ ] Convert to TypeScript
- [ ] Have a global progress bar (sconification process when calling API may
      take 6-7min)
- [ ] Have a type for the iapp.config.json to enable builder to know available
      configs -> would probably end up in a documentation page

### API

- [ ] Check again: Remove docker images & volumes after publication, to avoid
      "no space left on the VM" errors
- [ ] Start Node.js server when the VM starts?

Pour la prod, il faut qu'on signe l'image avec une clé de signature Intel. Pour
l'instant on ne fait que du debug. À terme il faudra mettre cette clé quelque
part sur la VM Azure.

Pouvoir créer l'app directement associée au owner ? À priori oui.

"iapp deploy" -> À renommer en "iapp publish" ?

ethers v6 pas supporté par scone ?

Push sur le dockerhub de teamproduct, revenir sur la CLI et refaire le push sur
le dockerhub de l'utilisateur = Utiliser le "docker login" qui a été fait sur la
machine du builder.

Creuser le scaling, savoir combien de sconifications on peut faire en parallèle,
comment on pourrait en faire plus ? Etc.
