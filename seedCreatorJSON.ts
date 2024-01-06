/*
    Seed creator v2.0.1 - By Megas
    How to use: Import the seedCreator.ts file and call the readAllTables function
    Ex: import model from './seedCreator';

    model.readAllTables({ allSeeds: true });
    model.readAllTables({ allSeeds: true, seedFile: true, logTables: false });
    Flag: allSeeds --> Create all seeds from all tables inside the ./prisma/seeds folder (create seeds folder if it doesn't exist)
    Flag: seedFile --> Create seed.ts file with all seeds imported
    Flag: logTables --> Log tables inside the console

    filters array: 
    [
      { keyToFilter: 'password', replaceTo: '01dfa4d90d9afbe', inTable: 'User' }, // Filter to not include in the seeds columns password and replaceTo = '01dfa4d90d9afbe' in the table User
      { keyToFilter: 'deletedAt' }, // Filter all keys deletedAt in all tables
      { keyToFilter: 'like', replaceTo: true, inTable: 'CommentAndLike' } // Filter all keys like in CommentAndLike table and replaceTo = true
    ] // This array is optional and you can add more filters

    Ex: model.readAllTables({ allSeeds: true, seedFile: true, logTables: false, arrFilters: filters });

    prisma[table].findMany({
        take: 1000,
      }); // Limit in 1000 rows

    After the seeds are created, you shuld run 'npx prisma db seed' (Ps: npx prisma migrate reset maybe dont make the seed all)
*/

import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs/promises';

const prisma = new PrismaClient();

export interface IFilter<T> {
  keyToFilter: string;
  replaceTo?: string | boolean | Date | number | Array<T> | object | undefined;
  inTable?: string;
}

// Filter to not include in the seeds
const filters: IFilter<[]>[] = [
  // {
  //   keyToFilter: 'password',
  //   replaceTo: '01dfa4d90d9afbe',
  //   inTable: 'User'
  // },
  // { keyToFilter: 'deletedAt' },
  // { keyToFilter: 'like', replaceTo: true, inTable: 'CommentAndLike' }
];

// Ex: User go to user | CommentAndLike go to commentAndLike
const snakeToCamel = (str: string) =>
  str.toLocaleLowerCase().replace(/([-_][a-z0-9])/g, (undeScoreAndString) => {
    return undeScoreAndString.toUpperCase().replace('-', '').replace('_', '');
  });

const writeTable = async (
  table: string,
  value: Array<Prisma.ModelName>,
  folder: string
) => {
  const tableNameCamelCase = snakeToCamel(table);
  const dir = `./prisma/${folder}`;
  await fs.mkdir(dir, { recursive: true });
  return fs.writeFile(
    `${dir}/${tableNameCamelCase}.json`,
    `${JSON.stringify(value, null, 2)}`
  );
};

const createSeedFile = (tables: Array<Prisma.ModelName>, folder: string) => {
  const fileString = `
import { Prisma, PrismaClient } from '@prisma/client';
import fs from 'fs/promises';

const prisma = new PrismaClient();

async function main() {
  const isDroped = true;
  let limit = 10;
  
  let tablesTryAgain: any[] = [];
  const tables = Object.keys(Prisma.ModelName);
  const MAX = limit;

  const snakeToCamel = (str: string) =>
    str.toLocaleLowerCase().replace(/([-_][a-z0-9])/g, (undeScoreAndString) => {
      return undeScoreAndString.toUpperCase().replace('-', '').replace('_', '');
    });

  const readFile = async (path: string) => {
    try {
      const data = await fs.readFile(\`./prisma/seeds/\${path}\`, 'utf8');
      const dataParse = JSON.parse(data);
      if (Array.isArray(dataParse)) return dataParse;
    } catch (error: any) {
      console.log(error.message, '<---XXX');
    }
    return [];
  };

  const seedTable = async (table: Prisma.ModelName) => {
    const data = await readFile(\`\${snakeToCamel(table)}.json\`);

    try {
      tablesTryAgain = tablesTryAgain.filter((t) => t !== table);
      // \@ts-expect-error ts(2322): Type 'string' is not assignable to type 'Prisma.ModelName'.
      await prisma[table].createMany({ data });
    } catch (error: any) {
      if (!error.message.toLowerCase().includes('unique constraint')) {
        console.log(
          '\\n XXXXXXXXX ',
          error.message,
          '\\n',
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
        // \@ts-expect-error ts(2322): Type 'string' is not assignable to type 'Prisma.ModelName'.
        await prisma[table].deleteMany({});
      } catch (error: any) {
        tablesTryAgain.push(table);
        console.log(
          '\\n XXXXXXXXX ',
          '\\n',
          table,
          '<--- FAIL TO DROPED XXXXX',
          tablesTryAgain,
          '\\n'
        );
      }
    }
  };
  const seedAll = async () => {
    for (let i = 0; i < tables.length; i++) {
      await seedTable(tables[i] as Prisma.ModelName);
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
    tablesTryAgain = [];
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

  `.trim();

  return fs.writeFile('./prisma/seed.ts', fileString);
};

const options = (key: string, value: any) => {
  switch (true) {
    case key === 'created_date' || key === 'updated_date':
      return new Date(value);

    case key === 'deleted_date' && Boolean(value):
      return new Date(value);

    case key === 'deleted_date':
      return null;

    default:
      return value;
  }
};

const removeNullElements = (obj: object) => {
  return Object.keys(obj).reduce((acc, key) => {
    const value = options(key, obj[key as keyof object]);
    if (value === null || value === undefined) {
      return acc;
    }
    acc[key as keyof object] = value as never;
    return acc;
  }, {} as object);
};

const filteredFields = (obj: object, filter: IFilter<[]>) => {
  const { keyToFilter, replaceTo } = filter;
  return Object.keys(obj).reduce((acc, key) => {
    if (key === keyToFilter) {
      if (replaceTo === undefined) {
        return acc;
      }

      // @ts-expect-error acc[key] = replaceTo
      acc[key] = replaceTo;
      return acc;
    }

    // @ts-expect-error acc[key] = obj[key]
    acc[key] = obj[key];
    return acc;
  }, {});
};

const filterTables = (obj: object, filters: IFilter<[]>[], key: string) => {
  return filters.reduce((acc, filter) => {
    if (filter.inTable && filter.inTable !== key) {
      return acc;
    }
    return filteredFields(acc, filter);
  }, obj) as object;
};

const createAllSeeds = async (
  tables: { [key: string]: [] },
  folder: string
) => {
  await Promise.allSettled(
    Object.keys(tables).map((key) => {
      writeTable(key, tables[key], folder);
    })
  );
};

// Stack to try again -- Tables to re try the find All if some promisse is rejected.
const stackTryAgain: { [key: string]: number } = {};

const findAndRefind = async (
  tables: string[],
  internalFilters: IFilter<[]>[]
) => {
  const selectsAll = await Promise.allSettled(
    tables.map((table) => {
      // @ts-expect-error prisma[key]
      return prisma[table].findMany({
        take: 1000,
      });
    })
  );

  const merged = selectsAll.reduce((acc, result, i) => {
    if (result.status !== 'fulfilled') {
      console.log('Error', result.reason, '<---Try Again XXXXX');
      stackTryAgain[tables[i]] = (stackTryAgain[tables[i]] || 0) + 1;
      return acc;
    }

    delete stackTryAgain[tables[i]];
    acc[tables[i]] = result.value.map((item: object) =>
      filterTables(
        removeNullElements(item),
        internalFilters,
        tables[i] as string
      )
    );
    return acc;
  }, {} as { [key: string]: [] });

  return merged;
};
export const readAllTables = async ({
  allSeeds = false,
  seedFile = false,
  logTables = true,
  arrFilters = filters,
  onlyTables = [] as Array<string>, // only especific tables
  folderName = 'seeds',
} = {}) => {
  const tables =
    onlyTables.length > 0
      ? onlyTables
      : (Object.keys(Prisma.ModelName as Record<string, string>) as string[]);

  const merged = !allSeeds ? {} : await findAndRefind(tables, arrFilters);

  const MAX_TRY_AGAIN = 3;
  let breakWhile = 10; // safe condition

  if (Object.keys(stackTryAgain).length > 0) {
    console.log(JSON.stringify(stackTryAgain, null, 2), '<--- stackTryAgain');
    console.log('\n **************** Go run while ************** \n');
    while (
      Object.keys(stackTryAgain).length > 0 &&
      Object.values(stackTryAgain).some((v) => v < MAX_TRY_AGAIN) &&
      breakWhile-- > 0
    ) {
      const newMerge = await findAndRefind(
        Object.keys(stackTryAgain) as string[],
        arrFilters
      );
      Object.assign(merged, newMerge);
    }
  }

  logTables && console.log('Start -->', merged, '<-- End');
  allSeeds && (await createAllSeeds(merged, folderName));
  seedFile &&
    (await createSeedFile(tables as Array<Prisma.ModelName>, folderName));
  console.log('Done ---');
  return { tables, collections: merged, stackTryAgain };
};

// import './seedCreatorJSON';
// /*
readAllTables({
  allSeeds: true,
  seedFile: true,
  logTables: false,
  onlyTables: [],
});
//  */
