/**
 * Generate a random username
 * Format: guest-[random animal]
 * @returns {string} A randomly generated username
 */
export function generateUsername() {
  // Expanded list of animals (approx. 200)
  const animals = [
    'aardvark', 'albatross', 'alligator', 'alpaca', 'ant', 'anteater', 'antelope', 'ape', 'armadillo', 'baboon',
    'badger', 'barracuda', 'bat', 'bear', 'beaver', 'bee', 'bison', 'boar', 'buffalo', 'butterfly',
    'camel', 'capybara', 'caribou', 'cassowary', 'cat', 'caterpillar', 'cattle', 'chameleon', 'cheetah', 'chicken',
    'chimpanzee', 'chinchilla', 'chough', 'clam', 'cobra', 'cockroach', 'cod', 'cormorant', 'coyote', 'crab',
    'crane', 'crocodile', 'crow', 'curlew', 'deer', 'dinosaur', 'dog', 'dogfish', 'dolphin', 'donkey',
    'dotterel', 'dove', 'dragonfly', 'duck', 'dugong', 'dunlin', 'eagle', 'echidna', 'eel', 'eland',
    'elephant', 'elk', 'emu', 'falcon', 'ferret', 'finch', 'fish', 'flamingo', 'fly', 'fox',
    'frog', 'gaur', 'gazelle', 'gerbil', 'giraffe', 'gnat', 'gnu', 'goat', 'goldfinch', 'goldfish',
    'goose', 'gorilla', 'goshawk', 'grasshopper', 'grouse', 'guanaco', 'gull', 'hamster', 'hare', 'hawk',
    'hedgehog', 'heron', 'herring', 'hippopotamus', 'hornet', 'horse', 'human', 'hummingbird', 'hyena', 'ibex',
    'ibis', 'jackal', 'jaguar', 'jay', 'jellyfish', 'kangaroo', 'kingfisher', 'koala', 'komododragon', 'kookabura',
    'kouprey', 'kudu', 'lapwing', 'lark', 'lemur', 'leopard', 'lion', 'llama', 'lobster', 'locust',
    'loris', 'louse', 'lyrebird', 'magpie', 'mallard', 'manatee', 'mandrill', 'mantis', 'marten', 'meerkat',
    'mink', 'mole', 'mongoose', 'monkey', 'moose', 'mosquito', 'mouse', 'mule', 'narwhal', 'newt',
    'nightingale', 'octopus', 'okapi', 'opossum', 'oryx', 'ostrich', 'otter', 'owl', 'ox', 'oyster',
    'panda', 'panther', 'parrot', 'partridge', 'peafowl', 'pelican', 'penguin', 'pheasant', 'pig', 'pigeon',
    'platypus', 'pony', 'porcupine', 'porpoise', 'possum', 'prairiedog', 'puffin', 'puma', 'python', 'quail',
    'quelea', 'quetzal', 'rabbit', 'raccoon', 'rail', 'ram', 'rat', 'rattlesnake', 'raven', 'reindeer',
    'rhinoceros', 'roadrunner', 'rook', 'salamander', 'salmon', 'sanddollar', 'sandpiper', 'sardine', 'scorpion', 'sealion',
    'seahorse', 'seal', 'serval', 'shark', 'sheep', 'shrew', 'shrimp', 'skunk', 'sloth', 'snail',
    'snake', 'sparrow', 'spider', 'spoonbill', 'squid', 'squirrel', 'starfish', 'starling', 'stingray', 'stinkbug',
    'stork', 'swallow', 'swan', 'tapir', 'tarsier', 'termite', 'tern', 'tiger', 'toad', 'toucan',
    'trout', 'turkey', 'turtle', 'viper', 'vulture', 'wallaby', 'walrus', 'wasp', 'waterbuffalo', 'weasel',
    'whale', 'wildcat', 'wolf', 'wolverine', 'wombat', 'woodcock', 'woodpecker', 'worm', 'wren', 'yak',
    'zebra'
  ];
  
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
  
  // Return in the new format guest-[animal]
  return `guest-${randomAnimal}`;
} 