# Project Seed Creator from database

This repository contains four essential files to facilitate database seeding using Prisma. Follow the instructions below to understand the purpose and usage of each file.

## File 1: `seed.cjs`

This file, `seed.cjs`, utilizes Prisma for performing database seeding. To execute the seeds, add the following command to your `package.json`:

```json
"prisma": {
  "seed": "node prisma/seed.cjs"
}
```

## File 2: `seed.ts`

Similar to `seed.cjs`, this file, `seed.ts`, is written in TypeScript. To execute the seeds using TypeScript, add the following command to your `package.json`:

```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

## File 3: `seedCreator.cjs`

The `seedCreator.cjs` file is one of the main seed generators. To run the seed generation, place this file in the project's root directory, along with Prisma, and execute the following command in the terminal:

```bash
node seedCreator.cjs
```

This will result in the creation of a `seeds` folder within the `prisma` directory.

## File 4: `seedCreatorJSON.ts`

Similar to `seedCreator.cjs`, the `seedCreatorJSON.ts` file is another main seed generator, this time written in TypeScript.

To execute the TypeScript seed generator, follow these steps:

1. Place `seedCreatorJSON.ts` in the project's root directory with Prisma.
2. Run the following command in the terminal:

```bash
ts-node seedCreatorJSON.ts
```

After generating the seeds from the database, populate the corresponding table by running the command:

```bash
npx prisma db seed
```

Ensure that the respective seed file (`.cjs` or `.ts`) is already in the Prisma directory.

---

### Project Description

This project provides a straightforward and organized approach to database seeding using Prisma. The included files offer flexibility with both JavaScript and TypeScript, enabling seamless integration and management of seeds for your application's database.

<hr>
<p align="center">
Developed with ❤️ by Megas
</p>
