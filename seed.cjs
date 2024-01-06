const { PrismaClient, Prisma } = require('@prisma/client');
const fs = require('fs/promises');

const prisma = new PrismaClient();

async function main() {
  const isDroped = true;
  let limit = 10;

  let tablesTryAgain = [];
  const tables = Object.keys(Prisma.ModelName);
  const MAX = limit;

  const snakeToCamel = (str) =>
    str.toLocaleLowerCase().replace(/([-_][a-z0-9])/g, (undeScoreAndString) => {
      return undeScoreAndString.toUpperCase().replace('-', '').replace('_', '');
    });

  const readFile = async (path) => {
    try {
      const data = await fs.readFile(`./prisma/seeds/${path}`, 'utf8');
      const dataParse = JSON.parse(data);
      if (Array.isArray(dataParse)) return dataParse;
    } catch (error) {
      console.log(error.message, '<---XXX');
    }
    return [];
  };

  const seedTable = async (table) => {
    const data = await readFile(`${snakeToCamel(table)}.json`);

    try {
      tablesTryAgain = tablesTryAgain.filter((t) => t !== table);
      await prisma[table].createMany({ data });
    } catch (error) {
      if (!error.message.toLowerCase().includes('unique constraint')) {
        console.log(
          '\n XXXXXXXXX ',
          error.message,
          '\n',
          table,
          '<---Adding in try Again XXXXX'
        );
        tablesTryAgain.push(table);
      }
    }
  };

  const dropAll = async (arrTables = tables) => {
    for (let i = 0; i < arrTables.length; i++) {
      const table = arrTables[i];
      try {
        tablesTryAgain = tablesTryAgain.filter((t) => t !== table);
        // @ts-expect-error ts(2322): Type 'string' is not assignable to type 'Prisma.ModelName'.
        await prisma[table].deleteMany({});
      } catch (error) {
        tablesTryAgain.push(table);
        console.log(
          '\n XXXXXXXXX ',
          '\n',
          table,
          '<--- FAIL TO DROPED XXXXX',
          tablesTryAgain,
          '\n'
        );
      }
    }
  };
  const seedAll = async () => {
    for (let i = 0; i < tables.length; i++) {
      await seedTable(tables[i]);
    }
  };
  console.clear();
  console.log('----------------------------');

  if (isDroped) {
    await dropAll();
    if (tablesTryAgain.length > 0) {
      while (tablesTryAgain.length > 0 && limit-- > 0) {
        await dropAll(tablesTryAgain);
      }
    }
    console.log(
      'The end',
      tablesTryAgain,
      '<-- Tables to seed (Fails) | Number of trys: ',
      MAX - limit
    );
    console.log('------END---DROP--ALL--XXXXX--------------');
    limit = MAX;
  }

  await seedAll();

  if (tablesTryAgain.length > 0) {
    while (tablesTryAgain.length > 0 && limit-- > 0) {
      await seedAll();
    }
  }

  console.log(
    'The end',
    tablesTryAgain,
    '<-- Tables to seed (Fails) | Number of trys: ',
    MAX - limit
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
