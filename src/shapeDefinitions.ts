import { BlockSet } from "./types";

type ShapeDefinition = Record<
  string,
  {
    sets: {
      flat?: boolean;
      basic?: boolean;
      extended?: boolean;
    };
    shape: string[];
  }
>;

const shapeDefinitions: ShapeDefinition = {
  shape7: {
    sets: {
      flat: true,
      extended: true,
    },
    shape: [
      `
---------
▢
---------`,
    ],
  },
  shape8: {
    sets: {
      flat: true,
      extended: true,
    },
    shape: [
      `
---------
▢▢
---------`,
    ],
  },
  shape4: {
    sets: {
      flat: true,
      extended: true,
    },
    shape: [
      `
---------
▢▢▢
---------`,
    ],
  },
  shape19: {
    sets: {
      extended: true,
    },
    shape: [
      `
---------
▢▢▢▢
---------`,
    ],
  },
  shape1: {
    sets: {
      flat: true,
      basic: true,
      extended: true,
    },
    shape: [
      `
---------
▢▢▢
▢
---------`,
    ],
  },

  shape2: {
    sets: {
      flat: true,
      basic: true,
    },
    shape: [
      `
---------
 ▢
▢▢▢
---------`,
    ],
  },

  shape3: {
    sets: {
      flat: true,
    },
    shape: [
      `
---------
▢▢
▢▢
---------`,
    ],
  },

  shape5: {
    sets: {
      flat: true,
      basic: true,
      extended: true,
    },
    shape: [
      `
---------
▢
▢▢
---------`,
    ],
  },
  shape6: {
    sets: {
      flat: true,
      basic: true,
      extended: true,
    },
    shape: [
      `
---------
 ▢▢
▢▢
---------`,
    ],
  },
  shape9: {
    sets: {
      basic: true,
      extended: true,
    },
    shape: [
      `
---------
 ▢
▢▢
---------`,
      `
---------
 
▢
---------`,
    ],
  },
  shape10: {
    sets: {
      basic: true,
    },
    shape: [
      `
---------
▢ 
▢▢
---------`,
      `
---------
▢ 

---------`,
    ],
  },
  shape11: {
    sets: {
      extended: true,
    },
    shape: [
      `
---------
 ▢
▢▢▢
▢
---------`,
    ],
  },
  shape12: {
    sets: {
      extended: true,
    },
    shape: [
      `
---------
 ▢▢
 ▢
▢▢
---------`,
    ],
  },
  shape13: {
    sets: {
      extended: true,
    },
    shape: [
      `
---------

▢▢
 ▢
---------`,
      `
---------
▢
▢

---------`,
    ],
  },
  shape14: {
    sets: {
      extended: true,
    },
    shape: [
      `
---------
▢▢
▢
▢
---------`,
      `
---------


▢
---------`,
    ],
  },
  shape15: {
    sets: {
      extended: true,
    },
    shape: [
      `
---------
▢
▢▢

---------`,
      `
---------

▢
▢
---------`,
    ],
  },
  shape16: {
    sets: {
      extended: true,
    },
    shape: [
      `
---------
▢
▢
▢▢
---------`,
      `
---------


▢
---------`,
    ],
  },
  shape17: {
    sets: {
      extended: true,
    },
    shape: [
      `
---------
▢▢
▢
▢▢
---------`,
    ],
  },
  shape18: {
    sets: {
      extended: true,
    },
    shape: [
      `
---------
▢
▢▢
▢▢
---------`,
    ],
  },
  shape20: {
    sets: {
      extended: true,
    },
    shape: [
      `
---------
 ▢
▢▢
▢
---------`,
      `
---------
 

▢
---------`,
    ],
  },
  shape21: {
    sets: {
      extended: true,
    },
    shape: [
      `
---------
▢
▢▢
▢
---------`,
      `
---------

 ▢

---------`,
    ],
  },
  shape23: {
    sets: {
      extended: true,
    },
    shape: [
      `
---------
▢
▢▢
▢
---------`,
      `
---------

▢

---------`,
    ],
  },
  shape22: {
    sets: {
      extended: true,
    },
    shape: [
      `
---------
▢
▢▢
  ▢▢
---------`,
    ],
  },
  shape24: {
    sets: {
      extended: true,
    },
    shape: [
      `
---------
▢
▢▢▢
▢
---------`,
    ],
  },
  shape25: {
    sets: {
      extended: true,
    },
    shape: [
      `
---------
▢
▢
▢▢
▢
---------`,
    ],
  },
  shape26: {
    sets: {
      extended: true,
    },
    shape: [
      `
---------
 ▢
▢▢▢
 ▢
---------`,
    ],
  },
  shape27: {
    sets: {
      extended: true,
    },
    shape: [
      `
---------
▢▢
▢▢
---------`,
      `
---------

▢
---------`,
    ],
  },
  shape28: {
    sets: {
      extended: true,
    },
    shape: [
      `
---------
   ▢
▢▢▢▢
---------`,
    ],
  },
  shape29: {
    sets: {
      extended: true,
    },
    shape: [
      `
---------
▢
▢
▢▢▢
---------`,
    ],
  },
  shape30: {
    sets: {
      extended: true,
    },
    shape: [
      `
---------
 ▢
 ▢
▢▢
▢
---------`,
    ],
  },
  shape31: {
    sets: {
      extended: true,
    },
    shape: [
      `
---------
▢▢
 ▢
---------`,
      `
---------
▢
 ▢
---------`,
    ],
  },
};

const shapeNames = Object.keys(
  shapeDefinitions
) as (keyof typeof shapeDefinitions)[];

export const getRandomShape = (blockSet: BlockSet) => {
  const shapesOfSet = shapeNames.filter(
    (shapeName) => shapeDefinitions[shapeName].sets[blockSet]
  );

  const shape = shapesOfSet[Math.floor(Math.random() * shapesOfSet.length)];
  return shapeDefinitions[shape].shape;
};
