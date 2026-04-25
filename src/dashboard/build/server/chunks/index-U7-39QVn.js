import { g as getDefaultExportFromCjs } from './_commonjsHelpers-BFTU3MAI.js';

const lib$2 = { exports: {} };

let lib$1;
let hasRequiredLib$2;

function requireLib$2 () {
	if (hasRequiredLib$2) return lib$1;
	hasRequiredLib$2 = 1;

	const _typeof = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? function (obj) {
		return typeof obj;
	} : function (obj) {
		return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype ? 'symbol' : typeof obj;
	};

	/**
	 * iterateObject
	 * Iterates an object. Note the object field order may differ.
	 *
	 * @name iterateObject
	 * @function
	 * @param {Object} obj The input object.
	 * @param {Function} fn A function that will be called with the current value, field name and provided object.
	 * @return {Function} The `iterateObject` function.
	 */
	function iterateObject(obj, fn) {
	    let i = 0,
	        keys = [];

	    if (Array.isArray(obj)) {
	        for (; i < obj.length; ++i) {
	            if (fn(obj[i], i, obj) === false) {
	                break;
	            }
	        }
	    } else if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj !== null) {
	        keys = Object.keys(obj);
	        for (; i < keys.length; ++i) {
	            if (fn(obj[keys[i]], keys[i], obj) === false) {
	                break;
	            }
	        }
	    }
	}

	lib$1 = iterateObject;
	return lib$1;
}

let lib;
let hasRequiredLib$1;

function requireLib$1 () {
	if (hasRequiredLib$1) return lib;
	hasRequiredLib$1 = 1;

	// Dependencies
	const iterateObject = requireLib$2();

	/**
	 * mapObject
	 * Array-map like for objects.
	 *
	 * @name mapObject
	 * @function
	 * @param {Object} obj The input object.
	 * @param {Function} fn A function returning the field values.
	 * @param {Boolean|Object} clone If `true`, the input object will be cloned.
	 * If `clone` is an object, it will be used as target object.
	 * @return {Object} The modified object.
	 */
	function mapObject(obj, fn, clone) {
	    const dst = clone === true ? {} : clone ? clone : obj;
	    iterateObject(obj, (v, n, o) => {
	        dst[n] = fn(v, n, o);
	    });
	    return dst;
	}

	lib = mapObject;
	return lib;
}

const grinning = {
	keywords: [
		'face',
		'smile',
		'happy',
		'joy',
		':D',
		'grin',
	],
	char: '😀',
	fitzpatrick_scale: false,
	category: 'people',
};
const grimacing = {
	keywords: [
		'face',
		'grimace',
		'teeth',
	],
	char: '😬',
	fitzpatrick_scale: false,
	category: 'people',
};
const grin = {
	keywords: [
		'face',
		'happy',
		'smile',
		'joy',
		'kawaii',
	],
	char: '😁',
	fitzpatrick_scale: false,
	category: 'people',
};
const joy = {
	keywords: [
		'face',
		'cry',
		'tears',
		'weep',
		'happy',
		'happytears',
		'haha',
	],
	char: '😂',
	fitzpatrick_scale: false,
	category: 'people',
};
const rofl = {
	keywords: [
		'face',
		'rolling',
		'floor',
		'laughing',
		'lol',
		'haha',
	],
	char: '🤣',
	fitzpatrick_scale: false,
	category: 'people',
};
const partying = {
	keywords: [
		'face',
		'celebration',
		'woohoo',
	],
	char: '🥳',
	fitzpatrick_scale: false,
	category: 'people',
};
const smiley = {
	keywords: [
		'face',
		'happy',
		'joy',
		'haha',
		':D',
		':)',
		'smile',
		'funny',
	],
	char: '😃',
	fitzpatrick_scale: false,
	category: 'people',
};
const smile = {
	keywords: [
		'face',
		'happy',
		'joy',
		'funny',
		'haha',
		'laugh',
		'like',
		':D',
		':)',
	],
	char: '😄',
	fitzpatrick_scale: false,
	category: 'people',
};
const sweat_smile = {
	keywords: [
		'face',
		'hot',
		'happy',
		'laugh',
		'sweat',
		'smile',
		'relief',
	],
	char: '😅',
	fitzpatrick_scale: false,
	category: 'people',
};
const laughing = {
	keywords: [
		'happy',
		'joy',
		'lol',
		'satisfied',
		'haha',
		'face',
		'glad',
		'XD',
		'laugh',
	],
	char: '😆',
	fitzpatrick_scale: false,
	category: 'people',
};
const innocent = {
	keywords: [
		'face',
		'angel',
		'heaven',
		'halo',
	],
	char: '😇',
	fitzpatrick_scale: false,
	category: 'people',
};
const wink = {
	keywords: [
		'face',
		'happy',
		'mischievous',
		'secret',
		';)',
		'smile',
		'eye',
	],
	char: '😉',
	fitzpatrick_scale: false,
	category: 'people',
};
const blush = {
	keywords: [
		'face',
		'smile',
		'happy',
		'flushed',
		'crush',
		'embarrassed',
		'shy',
		'joy',
	],
	char: '😊',
	fitzpatrick_scale: false,
	category: 'people',
};
const slightly_smiling_face = {
	keywords: [
		'face',
		'smile',
	],
	char: '🙂',
	fitzpatrick_scale: false,
	category: 'people',
};
const upside_down_face = {
	keywords: [
		'face',
		'flipped',
		'silly',
		'smile',
	],
	char: '🙃',
	fitzpatrick_scale: false,
	category: 'people',
};
const relaxed = {
	keywords: [
		'face',
		'blush',
		'massage',
		'happiness',
	],
	char: '☺️',
	fitzpatrick_scale: false,
	category: 'people',
};
const yum = {
	keywords: [
		'happy',
		'joy',
		'tongue',
		'smile',
		'face',
		'silly',
		'yummy',
		'nom',
		'delicious',
		'savouring',
	],
	char: '😋',
	fitzpatrick_scale: false,
	category: 'people',
};
const relieved = {
	keywords: [
		'face',
		'relaxed',
		'phew',
		'massage',
		'happiness',
	],
	char: '😌',
	fitzpatrick_scale: false,
	category: 'people',
};
const heart_eyes = {
	keywords: [
		'face',
		'love',
		'like',
		'affection',
		'valentines',
		'infatuation',
		'crush',
		'heart',
	],
	char: '😍',
	fitzpatrick_scale: false,
	category: 'people',
};
const smiling_face_with_three_hearts = {
	keywords: [
		'face',
		'love',
		'like',
		'affection',
		'valentines',
		'infatuation',
		'crush',
		'hearts',
		'adore',
	],
	char: '🥰',
	fitzpatrick_scale: false,
	category: 'people',
};
const kissing_heart = {
	keywords: [
		'face',
		'love',
		'like',
		'affection',
		'valentines',
		'infatuation',
		'kiss',
	],
	char: '😘',
	fitzpatrick_scale: false,
	category: 'people',
};
const kissing = {
	keywords: [
		'love',
		'like',
		'face',
		'3',
		'valentines',
		'infatuation',
		'kiss',
	],
	char: '😗',
	fitzpatrick_scale: false,
	category: 'people',
};
const kissing_smiling_eyes = {
	keywords: [
		'face',
		'affection',
		'valentines',
		'infatuation',
		'kiss',
	],
	char: '😙',
	fitzpatrick_scale: false,
	category: 'people',
};
const kissing_closed_eyes = {
	keywords: [
		'face',
		'love',
		'like',
		'affection',
		'valentines',
		'infatuation',
		'kiss',
	],
	char: '😚',
	fitzpatrick_scale: false,
	category: 'people',
};
const stuck_out_tongue_winking_eye = {
	keywords: [
		'face',
		'prank',
		'childish',
		'playful',
		'mischievous',
		'smile',
		'wink',
		'tongue',
	],
	char: '😜',
	fitzpatrick_scale: false,
	category: 'people',
};
const zany = {
	keywords: [
		'face',
		'goofy',
		'crazy',
	],
	char: '🤪',
	fitzpatrick_scale: false,
	category: 'people',
};
const raised_eyebrow = {
	keywords: [
		'face',
		'distrust',
		'scepticism',
		'disapproval',
		'disbelief',
		'surprise',
	],
	char: '🤨',
	fitzpatrick_scale: false,
	category: 'people',
};
const monocle = {
	keywords: [
		'face',
		'stuffy',
		'wealthy',
	],
	char: '🧐',
	fitzpatrick_scale: false,
	category: 'people',
};
const stuck_out_tongue_closed_eyes = {
	keywords: [
		'face',
		'prank',
		'playful',
		'mischievous',
		'smile',
		'tongue',
	],
	char: '😝',
	fitzpatrick_scale: false,
	category: 'people',
};
const stuck_out_tongue = {
	keywords: [
		'face',
		'prank',
		'childish',
		'playful',
		'mischievous',
		'smile',
		'tongue',
	],
	char: '😛',
	fitzpatrick_scale: false,
	category: 'people',
};
const money_mouth_face = {
	keywords: [
		'face',
		'rich',
		'dollar',
		'money',
	],
	char: '🤑',
	fitzpatrick_scale: false,
	category: 'people',
};
const nerd_face = {
	keywords: [
		'face',
		'nerdy',
		'geek',
		'dork',
	],
	char: '🤓',
	fitzpatrick_scale: false,
	category: 'people',
};
const sunglasses = {
	keywords: [
		'face',
		'cool',
		'smile',
		'summer',
		'beach',
		'sunglass',
	],
	char: '😎',
	fitzpatrick_scale: false,
	category: 'people',
};
const star_struck = {
	keywords: [
		'face',
		'smile',
		'starry',
		'eyes',
		'grinning',
	],
	char: '🤩',
	fitzpatrick_scale: false,
	category: 'people',
};
const clown_face = {
	keywords: [
		'face',
	],
	char: '🤡',
	fitzpatrick_scale: false,
	category: 'people',
};
const cowboy_hat_face = {
	keywords: [
		'face',
		'cowgirl',
		'hat',
	],
	char: '🤠',
	fitzpatrick_scale: false,
	category: 'people',
};
const hugs = {
	keywords: [
		'face',
		'smile',
		'hug',
	],
	char: '🤗',
	fitzpatrick_scale: false,
	category: 'people',
};
const smirk = {
	keywords: [
		'face',
		'smile',
		'mean',
		'prank',
		'smug',
		'sarcasm',
	],
	char: '😏',
	fitzpatrick_scale: false,
	category: 'people',
};
const no_mouth = {
	keywords: [
		'face',
		'hellokitty',
	],
	char: '😶',
	fitzpatrick_scale: false,
	category: 'people',
};
const neutral_face = {
	keywords: [
		'indifference',
		'meh',
		':|',
		'neutral',
	],
	char: '😐',
	fitzpatrick_scale: false,
	category: 'people',
};
const expressionless = {
	keywords: [
		'face',
		'indifferent',
		'-_-',
		'meh',
		'deadpan',
	],
	char: '😑',
	fitzpatrick_scale: false,
	category: 'people',
};
const unamused = {
	keywords: [
		'indifference',
		'bored',
		'straight face',
		'serious',
		'sarcasm',
		'unimpressed',
		'skeptical',
		'dubious',
		'side_eye',
	],
	char: '😒',
	fitzpatrick_scale: false,
	category: 'people',
};
const roll_eyes = {
	keywords: [
		'face',
		'eyeroll',
		'frustrated',
	],
	char: '🙄',
	fitzpatrick_scale: false,
	category: 'people',
};
const thinking = {
	keywords: [
		'face',
		'hmmm',
		'think',
		'consider',
	],
	char: '🤔',
	fitzpatrick_scale: false,
	category: 'people',
};
const lying_face = {
	keywords: [
		'face',
		'lie',
		'pinocchio',
	],
	char: '🤥',
	fitzpatrick_scale: false,
	category: 'people',
};
const hand_over_mouth = {
	keywords: [
		'face',
		'whoops',
		'shock',
		'surprise',
	],
	char: '🤭',
	fitzpatrick_scale: false,
	category: 'people',
};
const shushing = {
	keywords: [
		'face',
		'quiet',
		'shhh',
	],
	char: '🤫',
	fitzpatrick_scale: false,
	category: 'people',
};
const symbols_over_mouth = {
	keywords: [
		'face',
		'swearing',
		'cursing',
		'cussing',
		'profanity',
		'expletive',
	],
	char: '🤬',
	fitzpatrick_scale: false,
	category: 'people',
};
const exploding_head = {
	keywords: [
		'face',
		'shocked',
		'mind',
		'blown',
	],
	char: '🤯',
	fitzpatrick_scale: false,
	category: 'people',
};
const flushed = {
	keywords: [
		'face',
		'blush',
		'shy',
		'flattered',
	],
	char: '😳',
	fitzpatrick_scale: false,
	category: 'people',
};
const disappointed = {
	keywords: [
		'face',
		'sad',
		'upset',
		'depressed',
		':(',
	],
	char: '😞',
	fitzpatrick_scale: false,
	category: 'people',
};
const worried = {
	keywords: [
		'face',
		'concern',
		'nervous',
		':(',
	],
	char: '😟',
	fitzpatrick_scale: false,
	category: 'people',
};
const angry = {
	keywords: [
		'mad',
		'face',
		'annoyed',
		'frustrated',
	],
	char: '😠',
	fitzpatrick_scale: false,
	category: 'people',
};
const rage = {
	keywords: [
		'angry',
		'mad',
		'hate',
		'despise',
	],
	char: '😡',
	fitzpatrick_scale: false,
	category: 'people',
};
const pensive = {
	keywords: [
		'face',
		'sad',
		'depressed',
		'upset',
	],
	char: '😔',
	fitzpatrick_scale: false,
	category: 'people',
};
const confused = {
	keywords: [
		'face',
		'indifference',
		'huh',
		'weird',
		'hmmm',
		':/',
	],
	char: '😕',
	fitzpatrick_scale: false,
	category: 'people',
};
const slightly_frowning_face = {
	keywords: [
		'face',
		'frowning',
		'disappointed',
		'sad',
		'upset',
	],
	char: '🙁',
	fitzpatrick_scale: false,
	category: 'people',
};
const frowning_face = {
	keywords: [
		'face',
		'sad',
		'upset',
		'frown',
	],
	char: '☹',
	fitzpatrick_scale: false,
	category: 'people',
};
const persevere = {
	keywords: [
		'face',
		'sick',
		'no',
		'upset',
		'oops',
	],
	char: '😣',
	fitzpatrick_scale: false,
	category: 'people',
};
const confounded = {
	keywords: [
		'face',
		'confused',
		'sick',
		'unwell',
		'oops',
		':S',
	],
	char: '😖',
	fitzpatrick_scale: false,
	category: 'people',
};
const tired_face = {
	keywords: [
		'sick',
		'whine',
		'upset',
		'frustrated',
	],
	char: '😫',
	fitzpatrick_scale: false,
	category: 'people',
};
const weary = {
	keywords: [
		'face',
		'tired',
		'sleepy',
		'sad',
		'frustrated',
		'upset',
	],
	char: '😩',
	fitzpatrick_scale: false,
	category: 'people',
};
const pleading = {
	keywords: [
		'face',
		'begging',
		'mercy',
	],
	char: '🥺',
	fitzpatrick_scale: false,
	category: 'people',
};
const triumph = {
	keywords: [
		'face',
		'gas',
		'phew',
		'proud',
		'pride',
	],
	char: '😤',
	fitzpatrick_scale: false,
	category: 'people',
};
const open_mouth = {
	keywords: [
		'face',
		'surprise',
		'impressed',
		'wow',
		'whoa',
		':O',
	],
	char: '😮',
	fitzpatrick_scale: false,
	category: 'people',
};
const scream = {
	keywords: [
		'face',
		'munch',
		'scared',
		'omg',
	],
	char: '😱',
	fitzpatrick_scale: false,
	category: 'people',
};
const fearful = {
	keywords: [
		'face',
		'scared',
		'terrified',
		'nervous',
		'oops',
		'huh',
	],
	char: '😨',
	fitzpatrick_scale: false,
	category: 'people',
};
const cold_sweat = {
	keywords: [
		'face',
		'nervous',
		'sweat',
	],
	char: '😰',
	fitzpatrick_scale: false,
	category: 'people',
};
const hushed = {
	keywords: [
		'face',
		'woo',
		'shh',
	],
	char: '😯',
	fitzpatrick_scale: false,
	category: 'people',
};
const frowning = {
	keywords: [
		'face',
		'aw',
		'what',
	],
	char: '😦',
	fitzpatrick_scale: false,
	category: 'people',
};
const anguished = {
	keywords: [
		'face',
		'stunned',
		'nervous',
	],
	char: '😧',
	fitzpatrick_scale: false,
	category: 'people',
};
const cry = {
	keywords: [
		'face',
		'tears',
		'sad',
		'depressed',
		'upset',
		':\'(',
	],
	char: '😢',
	fitzpatrick_scale: false,
	category: 'people',
};
const disappointed_relieved = {
	keywords: [
		'face',
		'phew',
		'sweat',
		'nervous',
	],
	char: '😥',
	fitzpatrick_scale: false,
	category: 'people',
};
const drooling_face = {
	keywords: [
		'face',
	],
	char: '🤤',
	fitzpatrick_scale: false,
	category: 'people',
};
const sleepy = {
	keywords: [
		'face',
		'tired',
		'rest',
		'nap',
	],
	char: '😪',
	fitzpatrick_scale: false,
	category: 'people',
};
const sweat = {
	keywords: [
		'face',
		'hot',
		'sad',
		'tired',
		'exercise',
	],
	char: '😓',
	fitzpatrick_scale: false,
	category: 'people',
};
const hot = {
	keywords: [
		'face',
		'feverish',
		'heat',
		'red',
		'sweating',
	],
	char: '🥵',
	fitzpatrick_scale: false,
	category: 'people',
};
const cold = {
	keywords: [
		'face',
		'blue',
		'freezing',
		'frozen',
		'frostbite',
		'icicles',
	],
	char: '🥶',
	fitzpatrick_scale: false,
	category: 'people',
};
const sob = {
	keywords: [
		'face',
		'cry',
		'tears',
		'sad',
		'upset',
		'depressed',
	],
	char: '😭',
	fitzpatrick_scale: false,
	category: 'people',
};
const dizzy_face = {
	keywords: [
		'spent',
		'unconscious',
		'xox',
		'dizzy',
	],
	char: '😵',
	fitzpatrick_scale: false,
	category: 'people',
};
const astonished = {
	keywords: [
		'face',
		'xox',
		'surprised',
		'poisoned',
	],
	char: '😲',
	fitzpatrick_scale: false,
	category: 'people',
};
const zipper_mouth_face = {
	keywords: [
		'face',
		'sealed',
		'zipper',
		'secret',
	],
	char: '🤐',
	fitzpatrick_scale: false,
	category: 'people',
};
const nauseated_face = {
	keywords: [
		'face',
		'vomit',
		'gross',
		'green',
		'sick',
		'throw up',
		'ill',
	],
	char: '🤢',
	fitzpatrick_scale: false,
	category: 'people',
};
const sneezing_face = {
	keywords: [
		'face',
		'gesundheit',
		'sneeze',
		'sick',
		'allergy',
	],
	char: '🤧',
	fitzpatrick_scale: false,
	category: 'people',
};
const vomiting = {
	keywords: [
		'face',
		'sick',
	],
	char: '🤮',
	fitzpatrick_scale: false,
	category: 'people',
};
const mask = {
	keywords: [
		'face',
		'sick',
		'ill',
		'disease',
	],
	char: '😷',
	fitzpatrick_scale: false,
	category: 'people',
};
const face_with_thermometer = {
	keywords: [
		'sick',
		'temperature',
		'thermometer',
		'cold',
		'fever',
	],
	char: '🤒',
	fitzpatrick_scale: false,
	category: 'people',
};
const face_with_head_bandage = {
	keywords: [
		'injured',
		'clumsy',
		'bandage',
		'hurt',
	],
	char: '🤕',
	fitzpatrick_scale: false,
	category: 'people',
};
const woozy = {
	keywords: [
		'face',
		'dizzy',
		'intoxicated',
		'tipsy',
		'wavy',
	],
	char: '🥴',
	fitzpatrick_scale: false,
	category: 'people',
};
const sleeping = {
	keywords: [
		'face',
		'tired',
		'sleepy',
		'night',
		'zzz',
	],
	char: '😴',
	fitzpatrick_scale: false,
	category: 'people',
};
const zzz = {
	keywords: [
		'sleepy',
		'tired',
		'dream',
	],
	char: '💤',
	fitzpatrick_scale: false,
	category: 'people',
};
const poop = {
	keywords: [
		'hankey',
		'shitface',
		'fail',
		'turd',
		'shit',
	],
	char: '💩',
	fitzpatrick_scale: false,
	category: 'people',
};
const smiling_imp = {
	keywords: [
		'devil',
		'horns',
	],
	char: '😈',
	fitzpatrick_scale: false,
	category: 'people',
};
const imp = {
	keywords: [
		'devil',
		'angry',
		'horns',
	],
	char: '👿',
	fitzpatrick_scale: false,
	category: 'people',
};
const japanese_ogre = {
	keywords: [
		'monster',
		'red',
		'mask',
		'halloween',
		'scary',
		'creepy',
		'devil',
		'demon',
		'japanese',
		'ogre',
	],
	char: '👹',
	fitzpatrick_scale: false,
	category: 'people',
};
const japanese_goblin = {
	keywords: [
		'red',
		'evil',
		'mask',
		'monster',
		'scary',
		'creepy',
		'japanese',
		'goblin',
	],
	char: '👺',
	fitzpatrick_scale: false,
	category: 'people',
};
const skull = {
	keywords: [
		'dead',
		'skeleton',
		'creepy',
		'death',
	],
	char: '💀',
	fitzpatrick_scale: false,
	category: 'people',
};
const ghost = {
	keywords: [
		'halloween',
		'spooky',
		'scary',
	],
	char: '👻',
	fitzpatrick_scale: false,
	category: 'people',
};
const alien = {
	keywords: [
		'UFO',
		'paul',
		'weird',
		'outer_space',
	],
	char: '👽',
	fitzpatrick_scale: false,
	category: 'people',
};
const robot = {
	keywords: [
		'computer',
		'machine',
		'bot',
	],
	char: '🤖',
	fitzpatrick_scale: false,
	category: 'people',
};
const smiley_cat = {
	keywords: [
		'animal',
		'cats',
		'happy',
		'smile',
	],
	char: '😺',
	fitzpatrick_scale: false,
	category: 'people',
};
const smile_cat = {
	keywords: [
		'animal',
		'cats',
		'smile',
	],
	char: '😸',
	fitzpatrick_scale: false,
	category: 'people',
};
const joy_cat = {
	keywords: [
		'animal',
		'cats',
		'haha',
		'happy',
		'tears',
	],
	char: '😹',
	fitzpatrick_scale: false,
	category: 'people',
};
const heart_eyes_cat = {
	keywords: [
		'animal',
		'love',
		'like',
		'affection',
		'cats',
		'valentines',
		'heart',
	],
	char: '😻',
	fitzpatrick_scale: false,
	category: 'people',
};
const smirk_cat = {
	keywords: [
		'animal',
		'cats',
		'smirk',
	],
	char: '😼',
	fitzpatrick_scale: false,
	category: 'people',
};
const kissing_cat = {
	keywords: [
		'animal',
		'cats',
		'kiss',
	],
	char: '😽',
	fitzpatrick_scale: false,
	category: 'people',
};
const scream_cat = {
	keywords: [
		'animal',
		'cats',
		'munch',
		'scared',
		'scream',
	],
	char: '🙀',
	fitzpatrick_scale: false,
	category: 'people',
};
const crying_cat_face = {
	keywords: [
		'animal',
		'tears',
		'weep',
		'sad',
		'cats',
		'upset',
		'cry',
	],
	char: '😿',
	fitzpatrick_scale: false,
	category: 'people',
};
const pouting_cat = {
	keywords: [
		'animal',
		'cats',
	],
	char: '😾',
	fitzpatrick_scale: false,
	category: 'people',
};
const palms_up = {
	keywords: [
		'hands',
		'gesture',
		'cupped',
		'prayer',
	],
	char: '🤲',
	fitzpatrick_scale: true,
	category: 'people',
};
const raised_hands = {
	keywords: [
		'gesture',
		'hooray',
		'yea',
		'celebration',
		'hands',
	],
	char: '🙌',
	fitzpatrick_scale: true,
	category: 'people',
};
const clap = {
	keywords: [
		'hands',
		'praise',
		'applause',
		'congrats',
		'yay',
	],
	char: '👏',
	fitzpatrick_scale: true,
	category: 'people',
};
const wave = {
	keywords: [
		'hands',
		'gesture',
		'goodbye',
		'solong',
		'farewell',
		'hello',
		'hi',
		'palm',
	],
	char: '👋',
	fitzpatrick_scale: true,
	category: 'people',
};
const call_me_hand = {
	keywords: [
		'hands',
		'gesture',
	],
	char: '🤙',
	fitzpatrick_scale: true,
	category: 'people',
};
const facepunch = {
	keywords: [
		'angry',
		'violence',
		'fist',
		'hit',
		'attack',
		'hand',
	],
	char: '👊',
	fitzpatrick_scale: true,
	category: 'people',
};
const fist = {
	keywords: [
		'fingers',
		'hand',
		'grasp',
	],
	char: '✊',
	fitzpatrick_scale: true,
	category: 'people',
};
const fist_left = {
	keywords: [
		'hand',
		'fistbump',
	],
	char: '🤛',
	fitzpatrick_scale: true,
	category: 'people',
};
const fist_right = {
	keywords: [
		'hand',
		'fistbump',
	],
	char: '🤜',
	fitzpatrick_scale: true,
	category: 'people',
};
const v = {
	keywords: [
		'fingers',
		'ohyeah',
		'hand',
		'peace',
		'victory',
		'two',
	],
	char: '✌',
	fitzpatrick_scale: true,
	category: 'people',
};
const ok_hand = {
	keywords: [
		'fingers',
		'limbs',
		'perfect',
		'ok',
		'okay',
	],
	char: '👌',
	fitzpatrick_scale: true,
	category: 'people',
};
const raised_hand = {
	keywords: [
		'fingers',
		'stop',
		'highfive',
		'palm',
		'ban',
	],
	char: '✋',
	fitzpatrick_scale: true,
	category: 'people',
};
const raised_back_of_hand = {
	keywords: [
		'fingers',
		'raised',
		'backhand',
	],
	char: '🤚',
	fitzpatrick_scale: true,
	category: 'people',
};
const open_hands = {
	keywords: [
		'fingers',
		'butterfly',
		'hands',
		'open',
	],
	char: '👐',
	fitzpatrick_scale: true,
	category: 'people',
};
const muscle = {
	keywords: [
		'arm',
		'flex',
		'hand',
		'summer',
		'strong',
		'biceps',
	],
	char: '💪',
	fitzpatrick_scale: true,
	category: 'people',
};
const pray = {
	keywords: [
		'please',
		'hope',
		'wish',
		'namaste',
		'highfive',
	],
	char: '🙏',
	fitzpatrick_scale: true,
	category: 'people',
};
const foot = {
	keywords: [
		'kick',
		'stomp',
	],
	char: '🦶',
	fitzpatrick_scale: true,
	category: 'people',
};
const leg = {
	keywords: [
		'kick',
		'limb',
	],
	char: '🦵',
	fitzpatrick_scale: true,
	category: 'people',
};
const handshake = {
	keywords: [
		'agreement',
		'shake',
	],
	char: '🤝',
	fitzpatrick_scale: false,
	category: 'people',
};
const point_up = {
	keywords: [
		'hand',
		'fingers',
		'direction',
		'up',
	],
	char: '☝',
	fitzpatrick_scale: true,
	category: 'people',
};
const point_up_2 = {
	keywords: [
		'fingers',
		'hand',
		'direction',
		'up',
	],
	char: '👆',
	fitzpatrick_scale: true,
	category: 'people',
};
const point_down = {
	keywords: [
		'fingers',
		'hand',
		'direction',
		'down',
	],
	char: '👇',
	fitzpatrick_scale: true,
	category: 'people',
};
const point_left = {
	keywords: [
		'direction',
		'fingers',
		'hand',
		'left',
	],
	char: '👈',
	fitzpatrick_scale: true,
	category: 'people',
};
const point_right = {
	keywords: [
		'fingers',
		'hand',
		'direction',
		'right',
	],
	char: '👉',
	fitzpatrick_scale: true,
	category: 'people',
};
const fu = {
	keywords: [
		'hand',
		'fingers',
		'rude',
		'middle',
		'flipping',
	],
	char: '🖕',
	fitzpatrick_scale: true,
	category: 'people',
};
const raised_hand_with_fingers_splayed = {
	keywords: [
		'hand',
		'fingers',
		'palm',
	],
	char: '🖐',
	fitzpatrick_scale: true,
	category: 'people',
};
const love_you = {
	keywords: [
		'hand',
		'fingers',
		'gesture',
	],
	char: '🤟',
	fitzpatrick_scale: true,
	category: 'people',
};
const metal = {
	keywords: [
		'hand',
		'fingers',
		'evil_eye',
		'sign_of_horns',
		'rock_on',
	],
	char: '🤘',
	fitzpatrick_scale: true,
	category: 'people',
};
const crossed_fingers = {
	keywords: [
		'good',
		'lucky',
	],
	char: '🤞',
	fitzpatrick_scale: true,
	category: 'people',
};
const vulcan_salute = {
	keywords: [
		'hand',
		'fingers',
		'spock',
		'star trek',
	],
	char: '🖖',
	fitzpatrick_scale: true,
	category: 'people',
};
const writing_hand = {
	keywords: [
		'lower_left_ballpoint_pen',
		'stationery',
		'write',
		'compose',
	],
	char: '✍',
	fitzpatrick_scale: true,
	category: 'people',
};
const selfie = {
	keywords: [
		'camera',
		'phone',
	],
	char: '🤳',
	fitzpatrick_scale: true,
	category: 'people',
};
const nail_care = {
	keywords: [
		'beauty',
		'manicure',
		'finger',
		'fashion',
		'nail',
	],
	char: '💅',
	fitzpatrick_scale: true,
	category: 'people',
};
const lips = {
	keywords: [
		'mouth',
		'kiss',
	],
	char: '👄',
	fitzpatrick_scale: false,
	category: 'people',
};
const tooth = {
	keywords: [
		'teeth',
		'dentist',
	],
	char: '🦷',
	fitzpatrick_scale: false,
	category: 'people',
};
const tongue = {
	keywords: [
		'mouth',
		'playful',
	],
	char: '👅',
	fitzpatrick_scale: false,
	category: 'people',
};
const ear = {
	keywords: [
		'face',
		'hear',
		'sound',
		'listen',
	],
	char: '👂',
	fitzpatrick_scale: true,
	category: 'people',
};
const nose = {
	keywords: [
		'smell',
		'sniff',
	],
	char: '👃',
	fitzpatrick_scale: true,
	category: 'people',
};
const eye = {
	keywords: [
		'face',
		'look',
		'see',
		'watch',
		'stare',
	],
	char: '👁',
	fitzpatrick_scale: false,
	category: 'people',
};
const eyes = {
	keywords: [
		'look',
		'watch',
		'stalk',
		'peek',
		'see',
	],
	char: '👀',
	fitzpatrick_scale: false,
	category: 'people',
};
const brain = {
	keywords: [
		'smart',
		'intelligent',
	],
	char: '🧠',
	fitzpatrick_scale: false,
	category: 'people',
};
const bust_in_silhouette = {
	keywords: [
		'user',
		'person',
		'human',
	],
	char: '👤',
	fitzpatrick_scale: false,
	category: 'people',
};
const busts_in_silhouette = {
	keywords: [
		'user',
		'person',
		'human',
		'group',
		'team',
	],
	char: '👥',
	fitzpatrick_scale: false,
	category: 'people',
};
const speaking_head = {
	keywords: [
		'user',
		'person',
		'human',
		'sing',
		'say',
		'talk',
	],
	char: '🗣',
	fitzpatrick_scale: false,
	category: 'people',
};
const baby = {
	keywords: [
		'child',
		'boy',
		'girl',
		'toddler',
	],
	char: '👶',
	fitzpatrick_scale: true,
	category: 'people',
};
const child = {
	keywords: [
		'gender-neutral',
		'young',
	],
	char: '🧒',
	fitzpatrick_scale: true,
	category: 'people',
};
const boy = {
	keywords: [
		'man',
		'male',
		'guy',
		'teenager',
	],
	char: '👦',
	fitzpatrick_scale: true,
	category: 'people',
};
const girl = {
	keywords: [
		'female',
		'woman',
		'teenager',
	],
	char: '👧',
	fitzpatrick_scale: true,
	category: 'people',
};
const adult = {
	keywords: [
		'gender-neutral',
		'person',
	],
	char: '🧑',
	fitzpatrick_scale: true,
	category: 'people',
};
const man = {
	keywords: [
		'mustache',
		'father',
		'dad',
		'guy',
		'classy',
		'sir',
		'moustache',
	],
	char: '👨',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman = {
	keywords: [
		'female',
		'girls',
		'lady',
	],
	char: '👩',
	fitzpatrick_scale: true,
	category: 'people',
};
const blonde_woman = {
	keywords: [
		'woman',
		'female',
		'girl',
		'blonde',
		'person',
	],
	char: '👱‍♀️',
	fitzpatrick_scale: true,
	category: 'people',
};
const blonde_man = {
	keywords: [
		'man',
		'male',
		'boy',
		'blonde',
		'guy',
		'person',
	],
	char: '👱',
	fitzpatrick_scale: true,
	category: 'people',
};
const bearded_person = {
	keywords: [
		'person',
		'bewhiskered',
	],
	char: '🧔',
	fitzpatrick_scale: true,
	category: 'people',
};
const older_adult = {
	keywords: [
		'human',
		'elder',
		'senior',
		'gender-neutral',
	],
	char: '🧓',
	fitzpatrick_scale: true,
	category: 'people',
};
const older_man = {
	keywords: [
		'human',
		'male',
		'men',
		'old',
		'elder',
		'senior',
	],
	char: '👴',
	fitzpatrick_scale: true,
	category: 'people',
};
const older_woman = {
	keywords: [
		'human',
		'female',
		'women',
		'lady',
		'old',
		'elder',
		'senior',
	],
	char: '👵',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_with_gua_pi_mao = {
	keywords: [
		'male',
		'boy',
		'chinese',
	],
	char: '👲',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_with_headscarf = {
	keywords: [
		'female',
		'hijab',
		'mantilla',
		'tichel',
	],
	char: '🧕',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_with_turban = {
	keywords: [
		'female',
		'indian',
		'hinduism',
		'arabs',
		'woman',
	],
	char: '👳‍♀️',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_with_turban = {
	keywords: [
		'male',
		'indian',
		'hinduism',
		'arabs',
	],
	char: '👳',
	fitzpatrick_scale: true,
	category: 'people',
};
const policewoman = {
	keywords: [
		'woman',
		'police',
		'law',
		'legal',
		'enforcement',
		'arrest',
		'911',
		'female',
	],
	char: '👮‍♀️',
	fitzpatrick_scale: true,
	category: 'people',
};
const policeman = {
	keywords: [
		'man',
		'police',
		'law',
		'legal',
		'enforcement',
		'arrest',
		'911',
	],
	char: '👮',
	fitzpatrick_scale: true,
	category: 'people',
};
const construction_worker_woman = {
	keywords: [
		'female',
		'human',
		'wip',
		'build',
		'construction',
		'worker',
		'labor',
		'woman',
	],
	char: '👷‍♀️',
	fitzpatrick_scale: true,
	category: 'people',
};
const construction_worker_man = {
	keywords: [
		'male',
		'human',
		'wip',
		'guy',
		'build',
		'construction',
		'worker',
		'labor',
	],
	char: '👷',
	fitzpatrick_scale: true,
	category: 'people',
};
const guardswoman = {
	keywords: [
		'uk',
		'gb',
		'british',
		'female',
		'royal',
		'woman',
	],
	char: '💂‍♀️',
	fitzpatrick_scale: true,
	category: 'people',
};
const guardsman = {
	keywords: [
		'uk',
		'gb',
		'british',
		'male',
		'guy',
		'royal',
	],
	char: '💂',
	fitzpatrick_scale: true,
	category: 'people',
};
const female_detective = {
	keywords: [
		'human',
		'spy',
		'detective',
		'female',
		'woman',
	],
	char: '🕵️‍♀️',
	fitzpatrick_scale: true,
	category: 'people',
};
const male_detective = {
	keywords: [
		'human',
		'spy',
		'detective',
	],
	char: '🕵',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_health_worker = {
	keywords: [
		'doctor',
		'nurse',
		'therapist',
		'healthcare',
		'woman',
		'human',
	],
	char: '👩‍⚕️',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_health_worker = {
	keywords: [
		'doctor',
		'nurse',
		'therapist',
		'healthcare',
		'man',
		'human',
	],
	char: '👨‍⚕️',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_farmer = {
	keywords: [
		'rancher',
		'gardener',
		'woman',
		'human',
	],
	char: '👩‍🌾',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_farmer = {
	keywords: [
		'rancher',
		'gardener',
		'man',
		'human',
	],
	char: '👨‍🌾',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_cook = {
	keywords: [
		'chef',
		'woman',
		'human',
	],
	char: '👩‍🍳',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_cook = {
	keywords: [
		'chef',
		'man',
		'human',
	],
	char: '👨‍🍳',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_student = {
	keywords: [
		'graduate',
		'woman',
		'human',
	],
	char: '👩‍🎓',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_student = {
	keywords: [
		'graduate',
		'man',
		'human',
	],
	char: '👨‍🎓',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_singer = {
	keywords: [
		'rockstar',
		'entertainer',
		'woman',
		'human',
	],
	char: '👩‍🎤',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_singer = {
	keywords: [
		'rockstar',
		'entertainer',
		'man',
		'human',
	],
	char: '👨‍🎤',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_teacher = {
	keywords: [
		'instructor',
		'professor',
		'woman',
		'human',
	],
	char: '👩‍🏫',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_teacher = {
	keywords: [
		'instructor',
		'professor',
		'man',
		'human',
	],
	char: '👨‍🏫',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_factory_worker = {
	keywords: [
		'assembly',
		'industrial',
		'woman',
		'human',
	],
	char: '👩‍🏭',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_factory_worker = {
	keywords: [
		'assembly',
		'industrial',
		'man',
		'human',
	],
	char: '👨‍🏭',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_technologist = {
	keywords: [
		'coder',
		'developer',
		'engineer',
		'programmer',
		'software',
		'woman',
		'human',
		'laptop',
		'computer',
	],
	char: '👩‍💻',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_technologist = {
	keywords: [
		'coder',
		'developer',
		'engineer',
		'programmer',
		'software',
		'man',
		'human',
		'laptop',
		'computer',
	],
	char: '👨‍💻',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_office_worker = {
	keywords: [
		'business',
		'manager',
		'woman',
		'human',
	],
	char: '👩‍💼',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_office_worker = {
	keywords: [
		'business',
		'manager',
		'man',
		'human',
	],
	char: '👨‍💼',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_mechanic = {
	keywords: [
		'plumber',
		'woman',
		'human',
		'wrench',
	],
	char: '👩‍🔧',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_mechanic = {
	keywords: [
		'plumber',
		'man',
		'human',
		'wrench',
	],
	char: '👨‍🔧',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_scientist = {
	keywords: [
		'biologist',
		'chemist',
		'engineer',
		'physicist',
		'woman',
		'human',
	],
	char: '👩‍🔬',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_scientist = {
	keywords: [
		'biologist',
		'chemist',
		'engineer',
		'physicist',
		'man',
		'human',
	],
	char: '👨‍🔬',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_artist = {
	keywords: [
		'painter',
		'woman',
		'human',
	],
	char: '👩‍🎨',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_artist = {
	keywords: [
		'painter',
		'man',
		'human',
	],
	char: '👨‍🎨',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_firefighter = {
	keywords: [
		'fireman',
		'woman',
		'human',
	],
	char: '👩‍🚒',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_firefighter = {
	keywords: [
		'fireman',
		'man',
		'human',
	],
	char: '👨‍🚒',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_pilot = {
	keywords: [
		'aviator',
		'plane',
		'woman',
		'human',
	],
	char: '👩‍✈️',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_pilot = {
	keywords: [
		'aviator',
		'plane',
		'man',
		'human',
	],
	char: '👨‍✈️',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_astronaut = {
	keywords: [
		'space',
		'rocket',
		'woman',
		'human',
	],
	char: '👩‍🚀',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_astronaut = {
	keywords: [
		'space',
		'rocket',
		'man',
		'human',
	],
	char: '👨‍🚀',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_judge = {
	keywords: [
		'justice',
		'court',
		'woman',
		'human',
	],
	char: '👩‍⚖️',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_judge = {
	keywords: [
		'justice',
		'court',
		'man',
		'human',
	],
	char: '👨‍⚖️',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_superhero = {
	keywords: [
		'woman',
		'female',
		'good',
		'heroine',
		'superpowers',
	],
	char: '🦸‍♀️',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_superhero = {
	keywords: [
		'man',
		'male',
		'good',
		'hero',
		'superpowers',
	],
	char: '🦸‍♂️',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_supervillain = {
	keywords: [
		'woman',
		'female',
		'evil',
		'bad',
		'criminal',
		'heroine',
		'superpowers',
	],
	char: '🦹‍♀️',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_supervillain = {
	keywords: [
		'man',
		'male',
		'evil',
		'bad',
		'criminal',
		'hero',
		'superpowers',
	],
	char: '🦹‍♂️',
	fitzpatrick_scale: true,
	category: 'people',
};
const mrs_claus = {
	keywords: [
		'woman',
		'female',
		'xmas',
		'mother christmas',
	],
	char: '🤶',
	fitzpatrick_scale: true,
	category: 'people',
};
const santa = {
	keywords: [
		'festival',
		'man',
		'male',
		'xmas',
		'father christmas',
	],
	char: '🎅',
	fitzpatrick_scale: true,
	category: 'people',
};
const sorceress = {
	keywords: [
		'woman',
		'female',
		'mage',
		'witch',
	],
	char: '🧙‍♀️',
	fitzpatrick_scale: true,
	category: 'people',
};
const wizard = {
	keywords: [
		'man',
		'male',
		'mage',
		'sorcerer',
	],
	char: '🧙‍♂️',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_elf = {
	keywords: [
		'woman',
		'female',
	],
	char: '🧝‍♀️',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_elf = {
	keywords: [
		'man',
		'male',
	],
	char: '🧝‍♂️',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_vampire = {
	keywords: [
		'woman',
		'female',
	],
	char: '🧛‍♀️',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_vampire = {
	keywords: [
		'man',
		'male',
		'dracula',
	],
	char: '🧛‍♂️',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_zombie = {
	keywords: [
		'woman',
		'female',
		'undead',
		'walking dead',
	],
	char: '🧟‍♀️',
	fitzpatrick_scale: false,
	category: 'people',
};
const man_zombie = {
	keywords: [
		'man',
		'male',
		'dracula',
		'undead',
		'walking dead',
	],
	char: '🧟‍♂️',
	fitzpatrick_scale: false,
	category: 'people',
};
const woman_genie = {
	keywords: [
		'woman',
		'female',
	],
	char: '🧞‍♀️',
	fitzpatrick_scale: false,
	category: 'people',
};
const man_genie = {
	keywords: [
		'man',
		'male',
	],
	char: '🧞‍♂️',
	fitzpatrick_scale: false,
	category: 'people',
};
const mermaid = {
	keywords: [
		'woman',
		'female',
		'merwoman',
		'ariel',
	],
	char: '🧜‍♀️',
	fitzpatrick_scale: true,
	category: 'people',
};
const merman = {
	keywords: [
		'man',
		'male',
		'triton',
	],
	char: '🧜‍♂️',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_fairy = {
	keywords: [
		'woman',
		'female',
	],
	char: '🧚‍♀️',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_fairy = {
	keywords: [
		'man',
		'male',
	],
	char: '🧚‍♂️',
	fitzpatrick_scale: true,
	category: 'people',
};
const angel = {
	keywords: [
		'heaven',
		'wings',
		'halo',
	],
	char: '👼',
	fitzpatrick_scale: true,
	category: 'people',
};
const pregnant_woman = {
	keywords: [
		'baby',
	],
	char: '🤰',
	fitzpatrick_scale: true,
	category: 'people',
};
const breastfeeding = {
	keywords: [
		'nursing',
		'baby',
	],
	char: '🤱',
	fitzpatrick_scale: true,
	category: 'people',
};
const princess = {
	keywords: [
		'girl',
		'woman',
		'female',
		'blond',
		'crown',
		'royal',
		'queen',
	],
	char: '👸',
	fitzpatrick_scale: true,
	category: 'people',
};
const prince = {
	keywords: [
		'boy',
		'man',
		'male',
		'crown',
		'royal',
		'king',
	],
	char: '🤴',
	fitzpatrick_scale: true,
	category: 'people',
};
const bride_with_veil = {
	keywords: [
		'couple',
		'marriage',
		'wedding',
		'woman',
		'bride',
	],
	char: '👰',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_in_tuxedo = {
	keywords: [
		'couple',
		'marriage',
		'wedding',
		'groom',
	],
	char: '🤵',
	fitzpatrick_scale: true,
	category: 'people',
};
const running_woman = {
	keywords: [
		'woman',
		'walking',
		'exercise',
		'race',
		'running',
		'female',
	],
	char: '🏃‍♀️',
	fitzpatrick_scale: true,
	category: 'people',
};
const running_man = {
	keywords: [
		'man',
		'walking',
		'exercise',
		'race',
		'running',
	],
	char: '🏃',
	fitzpatrick_scale: true,
	category: 'people',
};
const walking_woman = {
	keywords: [
		'human',
		'feet',
		'steps',
		'woman',
		'female',
	],
	char: '🚶‍♀️',
	fitzpatrick_scale: true,
	category: 'people',
};
const walking_man = {
	keywords: [
		'human',
		'feet',
		'steps',
	],
	char: '🚶',
	fitzpatrick_scale: true,
	category: 'people',
};
const dancer = {
	keywords: [
		'female',
		'girl',
		'woman',
		'fun',
	],
	char: '💃',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_dancing = {
	keywords: [
		'male',
		'boy',
		'fun',
		'dancer',
	],
	char: '🕺',
	fitzpatrick_scale: true,
	category: 'people',
};
const dancing_women = {
	keywords: [
		'female',
		'bunny',
		'women',
		'girls',
	],
	char: '👯',
	fitzpatrick_scale: false,
	category: 'people',
};
const dancing_men = {
	keywords: [
		'male',
		'bunny',
		'men',
		'boys',
	],
	char: '👯‍♂️',
	fitzpatrick_scale: false,
	category: 'people',
};
const couple = {
	keywords: [
		'pair',
		'people',
		'human',
		'love',
		'date',
		'dating',
		'like',
		'affection',
		'valentines',
		'marriage',
	],
	char: '👫',
	fitzpatrick_scale: false,
	category: 'people',
};
const two_men_holding_hands = {
	keywords: [
		'pair',
		'couple',
		'love',
		'like',
		'bromance',
		'friendship',
		'people',
		'human',
	],
	char: '👬',
	fitzpatrick_scale: false,
	category: 'people',
};
const two_women_holding_hands = {
	keywords: [
		'pair',
		'friendship',
		'couple',
		'love',
		'like',
		'female',
		'people',
		'human',
	],
	char: '👭',
	fitzpatrick_scale: false,
	category: 'people',
};
const bowing_woman = {
	keywords: [
		'woman',
		'female',
		'girl',
	],
	char: '🙇‍♀️',
	fitzpatrick_scale: true,
	category: 'people',
};
const bowing_man = {
	keywords: [
		'man',
		'male',
		'boy',
	],
	char: '🙇',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_facepalming = {
	keywords: [
		'man',
		'male',
		'boy',
		'disbelief',
	],
	char: '🤦‍♂️',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_facepalming = {
	keywords: [
		'woman',
		'female',
		'girl',
		'disbelief',
	],
	char: '🤦‍♀️',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_shrugging = {
	keywords: [
		'woman',
		'female',
		'girl',
		'confused',
		'indifferent',
		'doubt',
	],
	char: '🤷',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_shrugging = {
	keywords: [
		'man',
		'male',
		'boy',
		'confused',
		'indifferent',
		'doubt',
	],
	char: '🤷‍♂️',
	fitzpatrick_scale: true,
	category: 'people',
};
const tipping_hand_woman = {
	keywords: [
		'female',
		'girl',
		'woman',
		'human',
		'information',
	],
	char: '💁',
	fitzpatrick_scale: true,
	category: 'people',
};
const tipping_hand_man = {
	keywords: [
		'male',
		'boy',
		'man',
		'human',
		'information',
	],
	char: '💁‍♂️',
	fitzpatrick_scale: true,
	category: 'people',
};
const no_good_woman = {
	keywords: [
		'female',
		'girl',
		'woman',
		'nope',
	],
	char: '🙅',
	fitzpatrick_scale: true,
	category: 'people',
};
const no_good_man = {
	keywords: [
		'male',
		'boy',
		'man',
		'nope',
	],
	char: '🙅‍♂️',
	fitzpatrick_scale: true,
	category: 'people',
};
const ok_woman = {
	keywords: [
		'women',
		'girl',
		'female',
		'pink',
		'human',
		'woman',
	],
	char: '🙆',
	fitzpatrick_scale: true,
	category: 'people',
};
const ok_man = {
	keywords: [
		'men',
		'boy',
		'male',
		'blue',
		'human',
		'man',
	],
	char: '🙆‍♂️',
	fitzpatrick_scale: true,
	category: 'people',
};
const raising_hand_woman = {
	keywords: [
		'female',
		'girl',
		'woman',
	],
	char: '🙋',
	fitzpatrick_scale: true,
	category: 'people',
};
const raising_hand_man = {
	keywords: [
		'male',
		'boy',
		'man',
	],
	char: '🙋‍♂️',
	fitzpatrick_scale: true,
	category: 'people',
};
const pouting_woman = {
	keywords: [
		'female',
		'girl',
		'woman',
	],
	char: '🙎',
	fitzpatrick_scale: true,
	category: 'people',
};
const pouting_man = {
	keywords: [
		'male',
		'boy',
		'man',
	],
	char: '🙎‍♂️',
	fitzpatrick_scale: true,
	category: 'people',
};
const frowning_woman = {
	keywords: [
		'female',
		'girl',
		'woman',
		'sad',
		'depressed',
		'discouraged',
		'unhappy',
	],
	char: '🙍',
	fitzpatrick_scale: true,
	category: 'people',
};
const frowning_man = {
	keywords: [
		'male',
		'boy',
		'man',
		'sad',
		'depressed',
		'discouraged',
		'unhappy',
	],
	char: '🙍‍♂️',
	fitzpatrick_scale: true,
	category: 'people',
};
const haircut_woman = {
	keywords: [
		'female',
		'girl',
		'woman',
	],
	char: '💇',
	fitzpatrick_scale: true,
	category: 'people',
};
const haircut_man = {
	keywords: [
		'male',
		'boy',
		'man',
	],
	char: '💇‍♂️',
	fitzpatrick_scale: true,
	category: 'people',
};
const massage_woman = {
	keywords: [
		'female',
		'girl',
		'woman',
		'head',
	],
	char: '💆',
	fitzpatrick_scale: true,
	category: 'people',
};
const massage_man = {
	keywords: [
		'male',
		'boy',
		'man',
		'head',
	],
	char: '💆‍♂️',
	fitzpatrick_scale: true,
	category: 'people',
};
const woman_in_steamy_room = {
	keywords: [
		'female',
		'woman',
		'spa',
		'steamroom',
		'sauna',
	],
	char: '🧖‍♀️',
	fitzpatrick_scale: true,
	category: 'people',
};
const man_in_steamy_room = {
	keywords: [
		'male',
		'man',
		'spa',
		'steamroom',
		'sauna',
	],
	char: '🧖‍♂️',
	fitzpatrick_scale: true,
	category: 'people',
};
const couple_with_heart_woman_man = {
	keywords: [
		'pair',
		'love',
		'like',
		'affection',
		'human',
		'dating',
		'valentines',
		'marriage',
	],
	char: '💑',
	fitzpatrick_scale: false,
	category: 'people',
};
const couple_with_heart_woman_woman = {
	keywords: [
		'pair',
		'love',
		'like',
		'affection',
		'human',
		'dating',
		'valentines',
		'marriage',
	],
	char: '👩‍❤️‍👩',
	fitzpatrick_scale: false,
	category: 'people',
};
const couple_with_heart_man_man = {
	keywords: [
		'pair',
		'love',
		'like',
		'affection',
		'human',
		'dating',
		'valentines',
		'marriage',
	],
	char: '👨‍❤️‍👨',
	fitzpatrick_scale: false,
	category: 'people',
};
const couplekiss_man_woman = {
	keywords: [
		'pair',
		'valentines',
		'love',
		'like',
		'dating',
		'marriage',
	],
	char: '💏',
	fitzpatrick_scale: false,
	category: 'people',
};
const couplekiss_woman_woman = {
	keywords: [
		'pair',
		'valentines',
		'love',
		'like',
		'dating',
		'marriage',
	],
	char: '👩‍❤️‍💋‍👩',
	fitzpatrick_scale: false,
	category: 'people',
};
const couplekiss_man_man = {
	keywords: [
		'pair',
		'valentines',
		'love',
		'like',
		'dating',
		'marriage',
	],
	char: '👨‍❤️‍💋‍👨',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_man_woman_boy = {
	keywords: [
		'home',
		'parents',
		'child',
		'mom',
		'dad',
		'father',
		'mother',
		'people',
		'human',
	],
	char: '👪',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_man_woman_girl = {
	keywords: [
		'home',
		'parents',
		'people',
		'human',
		'child',
	],
	char: '👨‍👩‍👧',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_man_woman_girl_boy = {
	keywords: [
		'home',
		'parents',
		'people',
		'human',
		'children',
	],
	char: '👨‍👩‍👧‍👦',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_man_woman_boy_boy = {
	keywords: [
		'home',
		'parents',
		'people',
		'human',
		'children',
	],
	char: '👨‍👩‍👦‍👦',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_man_woman_girl_girl = {
	keywords: [
		'home',
		'parents',
		'people',
		'human',
		'children',
	],
	char: '👨‍👩‍👧‍👧',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_woman_woman_boy = {
	keywords: [
		'home',
		'parents',
		'people',
		'human',
		'children',
	],
	char: '👩‍👩‍👦',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_woman_woman_girl = {
	keywords: [
		'home',
		'parents',
		'people',
		'human',
		'children',
	],
	char: '👩‍👩‍👧',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_woman_woman_girl_boy = {
	keywords: [
		'home',
		'parents',
		'people',
		'human',
		'children',
	],
	char: '👩‍👩‍👧‍👦',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_woman_woman_boy_boy = {
	keywords: [
		'home',
		'parents',
		'people',
		'human',
		'children',
	],
	char: '👩‍👩‍👦‍👦',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_woman_woman_girl_girl = {
	keywords: [
		'home',
		'parents',
		'people',
		'human',
		'children',
	],
	char: '👩‍👩‍👧‍👧',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_man_man_boy = {
	keywords: [
		'home',
		'parents',
		'people',
		'human',
		'children',
	],
	char: '👨‍👨‍👦',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_man_man_girl = {
	keywords: [
		'home',
		'parents',
		'people',
		'human',
		'children',
	],
	char: '👨‍👨‍👧',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_man_man_girl_boy = {
	keywords: [
		'home',
		'parents',
		'people',
		'human',
		'children',
	],
	char: '👨‍👨‍👧‍👦',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_man_man_boy_boy = {
	keywords: [
		'home',
		'parents',
		'people',
		'human',
		'children',
	],
	char: '👨‍👨‍👦‍👦',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_man_man_girl_girl = {
	keywords: [
		'home',
		'parents',
		'people',
		'human',
		'children',
	],
	char: '👨‍👨‍👧‍👧',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_woman_boy = {
	keywords: [
		'home',
		'parent',
		'people',
		'human',
		'child',
	],
	char: '👩‍👦',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_woman_girl = {
	keywords: [
		'home',
		'parent',
		'people',
		'human',
		'child',
	],
	char: '👩‍👧',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_woman_girl_boy = {
	keywords: [
		'home',
		'parent',
		'people',
		'human',
		'children',
	],
	char: '👩‍👧‍👦',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_woman_boy_boy = {
	keywords: [
		'home',
		'parent',
		'people',
		'human',
		'children',
	],
	char: '👩‍👦‍👦',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_woman_girl_girl = {
	keywords: [
		'home',
		'parent',
		'people',
		'human',
		'children',
	],
	char: '👩‍👧‍👧',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_man_boy = {
	keywords: [
		'home',
		'parent',
		'people',
		'human',
		'child',
	],
	char: '👨‍👦',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_man_girl = {
	keywords: [
		'home',
		'parent',
		'people',
		'human',
		'child',
	],
	char: '👨‍👧',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_man_girl_boy = {
	keywords: [
		'home',
		'parent',
		'people',
		'human',
		'children',
	],
	char: '👨‍👧‍👦',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_man_boy_boy = {
	keywords: [
		'home',
		'parent',
		'people',
		'human',
		'children',
	],
	char: '👨‍👦‍👦',
	fitzpatrick_scale: false,
	category: 'people',
};
const family_man_girl_girl = {
	keywords: [
		'home',
		'parent',
		'people',
		'human',
		'children',
	],
	char: '👨‍👧‍👧',
	fitzpatrick_scale: false,
	category: 'people',
};
const yarn = {
	keywords: [
		'ball',
		'crochet',
		'knit',
	],
	char: '🧶',
	fitzpatrick_scale: false,
	category: 'people',
};
const thread = {
	keywords: [
		'needle',
		'sewing',
		'spool',
		'string',
	],
	char: '🧵',
	fitzpatrick_scale: false,
	category: 'people',
};
const coat = {
	keywords: [
		'jacket',
	],
	char: '🧥',
	fitzpatrick_scale: false,
	category: 'people',
};
const labcoat = {
	keywords: [
		'doctor',
		'experiment',
		'scientist',
		'chemist',
	],
	char: '🥼',
	fitzpatrick_scale: false,
	category: 'people',
};
const womans_clothes = {
	keywords: [
		'fashion',
		'shopping_bags',
		'female',
	],
	char: '👚',
	fitzpatrick_scale: false,
	category: 'people',
};
const tshirt = {
	keywords: [
		'fashion',
		'cloth',
		'casual',
		'shirt',
		'tee',
	],
	char: '👕',
	fitzpatrick_scale: false,
	category: 'people',
};
const jeans = {
	keywords: [
		'fashion',
		'shopping',
	],
	char: '👖',
	fitzpatrick_scale: false,
	category: 'people',
};
const necktie = {
	keywords: [
		'shirt',
		'suitup',
		'formal',
		'fashion',
		'cloth',
		'business',
	],
	char: '👔',
	fitzpatrick_scale: false,
	category: 'people',
};
const dress = {
	keywords: [
		'clothes',
		'fashion',
		'shopping',
	],
	char: '👗',
	fitzpatrick_scale: false,
	category: 'people',
};
const bikini = {
	keywords: [
		'swimming',
		'female',
		'woman',
		'girl',
		'fashion',
		'beach',
		'summer',
	],
	char: '👙',
	fitzpatrick_scale: false,
	category: 'people',
};
const kimono = {
	keywords: [
		'dress',
		'fashion',
		'women',
		'female',
		'japanese',
	],
	char: '👘',
	fitzpatrick_scale: false,
	category: 'people',
};
const lipstick = {
	keywords: [
		'female',
		'girl',
		'fashion',
		'woman',
	],
	char: '💄',
	fitzpatrick_scale: false,
	category: 'people',
};
const kiss = {
	keywords: [
		'face',
		'lips',
		'love',
		'like',
		'affection',
		'valentines',
	],
	char: '💋',
	fitzpatrick_scale: false,
	category: 'people',
};
const footprints = {
	keywords: [
		'feet',
		'tracking',
		'walking',
		'beach',
	],
	char: '👣',
	fitzpatrick_scale: false,
	category: 'people',
};
const flat_shoe = {
	keywords: [
		'ballet',
		'slip-on',
		'slipper',
	],
	char: '🥿',
	fitzpatrick_scale: false,
	category: 'people',
};
const high_heel = {
	keywords: [
		'fashion',
		'shoes',
		'female',
		'pumps',
		'stiletto',
	],
	char: '👠',
	fitzpatrick_scale: false,
	category: 'people',
};
const sandal = {
	keywords: [
		'shoes',
		'fashion',
		'flip flops',
	],
	char: '👡',
	fitzpatrick_scale: false,
	category: 'people',
};
const boot = {
	keywords: [
		'shoes',
		'fashion',
	],
	char: '👢',
	fitzpatrick_scale: false,
	category: 'people',
};
const mans_shoe = {
	keywords: [
		'fashion',
		'male',
	],
	char: '👞',
	fitzpatrick_scale: false,
	category: 'people',
};
const athletic_shoe = {
	keywords: [
		'shoes',
		'sports',
		'sneakers',
	],
	char: '👟',
	fitzpatrick_scale: false,
	category: 'people',
};
const hiking_boot = {
	keywords: [
		'backpacking',
		'camping',
		'hiking',
	],
	char: '🥾',
	fitzpatrick_scale: false,
	category: 'people',
};
const socks = {
	keywords: [
		'stockings',
		'clothes',
	],
	char: '🧦',
	fitzpatrick_scale: false,
	category: 'people',
};
const gloves = {
	keywords: [
		'hands',
		'winter',
		'clothes',
	],
	char: '🧤',
	fitzpatrick_scale: false,
	category: 'people',
};
const scarf = {
	keywords: [
		'neck',
		'winter',
		'clothes',
	],
	char: '🧣',
	fitzpatrick_scale: false,
	category: 'people',
};
const womans_hat = {
	keywords: [
		'fashion',
		'accessories',
		'female',
		'lady',
		'spring',
	],
	char: '👒',
	fitzpatrick_scale: false,
	category: 'people',
};
const tophat = {
	keywords: [
		'magic',
		'gentleman',
		'classy',
		'circus',
	],
	char: '🎩',
	fitzpatrick_scale: false,
	category: 'people',
};
const billed_hat = {
	keywords: [
		'cap',
		'baseball',
	],
	char: '🧢',
	fitzpatrick_scale: false,
	category: 'people',
};
const rescue_worker_helmet = {
	keywords: [
		'construction',
		'build',
	],
	char: '⛑',
	fitzpatrick_scale: false,
	category: 'people',
};
const mortar_board = {
	keywords: [
		'school',
		'college',
		'degree',
		'university',
		'graduation',
		'cap',
		'hat',
		'legal',
		'learn',
		'education',
	],
	char: '🎓',
	fitzpatrick_scale: false,
	category: 'people',
};
const crown = {
	keywords: [
		'king',
		'kod',
		'leader',
		'royalty',
		'lord',
	],
	char: '👑',
	fitzpatrick_scale: false,
	category: 'people',
};
const school_satchel = {
	keywords: [
		'student',
		'education',
		'bag',
		'backpack',
	],
	char: '🎒',
	fitzpatrick_scale: false,
	category: 'people',
};
const luggage = {
	keywords: [
		'packing',
		'travel',
	],
	char: '🧳',
	fitzpatrick_scale: false,
	category: 'people',
};
const pouch = {
	keywords: [
		'bag',
		'accessories',
		'shopping',
	],
	char: '👝',
	fitzpatrick_scale: false,
	category: 'people',
};
const purse = {
	keywords: [
		'fashion',
		'accessories',
		'money',
		'sales',
		'shopping',
	],
	char: '👛',
	fitzpatrick_scale: false,
	category: 'people',
};
const handbag = {
	keywords: [
		'fashion',
		'accessory',
		'accessories',
		'shopping',
	],
	char: '👜',
	fitzpatrick_scale: false,
	category: 'people',
};
const briefcase = {
	keywords: [
		'business',
		'documents',
		'work',
		'law',
		'legal',
		'job',
		'career',
	],
	char: '💼',
	fitzpatrick_scale: false,
	category: 'people',
};
const eyeglasses = {
	keywords: [
		'fashion',
		'accessories',
		'eyesight',
		'nerdy',
		'dork',
		'geek',
	],
	char: '👓',
	fitzpatrick_scale: false,
	category: 'people',
};
const dark_sunglasses = {
	keywords: [
		'face',
		'cool',
		'accessories',
	],
	char: '🕶',
	fitzpatrick_scale: false,
	category: 'people',
};
const goggles = {
	keywords: [
		'eyes',
		'protection',
		'safety',
	],
	char: '🥽',
	fitzpatrick_scale: false,
	category: 'people',
};
const ring = {
	keywords: [
		'wedding',
		'propose',
		'marriage',
		'valentines',
		'diamond',
		'fashion',
		'jewelry',
		'gem',
		'engagement',
	],
	char: '💍',
	fitzpatrick_scale: false,
	category: 'people',
};
const closed_umbrella = {
	keywords: [
		'weather',
		'rain',
		'drizzle',
	],
	char: '🌂',
	fitzpatrick_scale: false,
	category: 'people',
};
const dog = {
	keywords: [
		'animal',
		'friend',
		'nature',
		'woof',
		'puppy',
		'pet',
		'faithful',
	],
	char: '🐶',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const cat = {
	keywords: [
		'animal',
		'meow',
		'nature',
		'pet',
		'kitten',
	],
	char: '🐱',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const mouse = {
	keywords: [
		'animal',
		'nature',
		'cheese_wedge',
		'rodent',
	],
	char: '🐭',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const hamster = {
	keywords: [
		'animal',
		'nature',
	],
	char: '🐹',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const rabbit = {
	keywords: [
		'animal',
		'nature',
		'pet',
		'spring',
		'magic',
		'bunny',
	],
	char: '🐰',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const fox_face = {
	keywords: [
		'animal',
		'nature',
		'face',
	],
	char: '🦊',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const bear = {
	keywords: [
		'animal',
		'nature',
		'wild',
	],
	char: '🐻',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const panda_face = {
	keywords: [
		'animal',
		'nature',
		'panda',
	],
	char: '🐼',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const koala = {
	keywords: [
		'animal',
		'nature',
	],
	char: '🐨',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const tiger = {
	keywords: [
		'animal',
		'cat',
		'danger',
		'wild',
		'nature',
		'roar',
	],
	char: '🐯',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const lion = {
	keywords: [
		'animal',
		'nature',
	],
	char: '🦁',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const cow = {
	keywords: [
		'beef',
		'ox',
		'animal',
		'nature',
		'moo',
		'milk',
	],
	char: '🐮',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const pig = {
	keywords: [
		'animal',
		'oink',
		'nature',
	],
	char: '🐷',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const pig_nose = {
	keywords: [
		'animal',
		'oink',
	],
	char: '🐽',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const frog = {
	keywords: [
		'animal',
		'nature',
		'croak',
		'toad',
	],
	char: '🐸',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const squid = {
	keywords: [
		'animal',
		'nature',
		'ocean',
		'sea',
	],
	char: '🦑',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const octopus = {
	keywords: [
		'animal',
		'creature',
		'ocean',
		'sea',
		'nature',
		'beach',
	],
	char: '🐙',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const shrimp = {
	keywords: [
		'animal',
		'ocean',
		'nature',
		'seafood',
	],
	char: '🦐',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const monkey_face = {
	keywords: [
		'animal',
		'nature',
		'circus',
	],
	char: '🐵',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const gorilla = {
	keywords: [
		'animal',
		'nature',
		'circus',
	],
	char: '🦍',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const see_no_evil = {
	keywords: [
		'monkey',
		'animal',
		'nature',
		'haha',
	],
	char: '🙈',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const hear_no_evil = {
	keywords: [
		'animal',
		'monkey',
		'nature',
	],
	char: '🙉',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const speak_no_evil = {
	keywords: [
		'monkey',
		'animal',
		'nature',
		'omg',
	],
	char: '🙊',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const monkey = {
	keywords: [
		'animal',
		'nature',
		'banana',
		'circus',
	],
	char: '🐒',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const chicken = {
	keywords: [
		'animal',
		'cluck',
		'nature',
		'bird',
	],
	char: '🐔',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const penguin = {
	keywords: [
		'animal',
		'nature',
	],
	char: '🐧',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const bird = {
	keywords: [
		'animal',
		'nature',
		'fly',
		'tweet',
		'spring',
	],
	char: '🐦',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const baby_chick = {
	keywords: [
		'animal',
		'chicken',
		'bird',
	],
	char: '🐤',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const hatching_chick = {
	keywords: [
		'animal',
		'chicken',
		'egg',
		'born',
		'baby',
		'bird',
	],
	char: '🐣',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const hatched_chick = {
	keywords: [
		'animal',
		'chicken',
		'baby',
		'bird',
	],
	char: '🐥',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const duck = {
	keywords: [
		'animal',
		'nature',
		'bird',
		'mallard',
	],
	char: '🦆',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const eagle = {
	keywords: [
		'animal',
		'nature',
		'bird',
	],
	char: '🦅',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const owl = {
	keywords: [
		'animal',
		'nature',
		'bird',
		'hoot',
	],
	char: '🦉',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const bat = {
	keywords: [
		'animal',
		'nature',
		'blind',
		'vampire',
	],
	char: '🦇',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const wolf = {
	keywords: [
		'animal',
		'nature',
		'wild',
	],
	char: '🐺',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const boar = {
	keywords: [
		'animal',
		'nature',
	],
	char: '🐗',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const horse = {
	keywords: [
		'animal',
		'brown',
		'nature',
	],
	char: '🐴',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const unicorn = {
	keywords: [
		'animal',
		'nature',
		'mystical',
	],
	char: '🦄',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const honeybee = {
	keywords: [
		'animal',
		'insect',
		'nature',
		'bug',
		'spring',
		'honey',
	],
	char: '🐝',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const bug = {
	keywords: [
		'animal',
		'insect',
		'nature',
		'worm',
	],
	char: '🐛',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const butterfly = {
	keywords: [
		'animal',
		'insect',
		'nature',
		'caterpillar',
	],
	char: '🦋',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const snail = {
	keywords: [
		'slow',
		'animal',
		'shell',
	],
	char: '🐌',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const beetle = {
	keywords: [
		'animal',
		'insect',
		'nature',
		'ladybug',
	],
	char: '🐞',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const ant = {
	keywords: [
		'animal',
		'insect',
		'nature',
		'bug',
	],
	char: '🐜',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const grasshopper = {
	keywords: [
		'animal',
		'cricket',
		'chirp',
	],
	char: '🦗',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const spider = {
	keywords: [
		'animal',
		'arachnid',
	],
	char: '🕷',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const scorpion = {
	keywords: [
		'animal',
		'arachnid',
	],
	char: '🦂',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const crab = {
	keywords: [
		'animal',
		'crustacean',
	],
	char: '🦀',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const snake = {
	keywords: [
		'animal',
		'evil',
		'nature',
		'hiss',
		'python',
	],
	char: '🐍',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const lizard = {
	keywords: [
		'animal',
		'nature',
		'reptile',
	],
	char: '🦎',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const sauropod = {
	keywords: [
		'animal',
		'nature',
		'dinosaur',
		'brachiosaurus',
		'brontosaurus',
		'diplodocus',
		'extinct',
	],
	char: '🦕',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const turtle = {
	keywords: [
		'animal',
		'slow',
		'nature',
		'tortoise',
	],
	char: '🐢',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const tropical_fish = {
	keywords: [
		'animal',
		'swim',
		'ocean',
		'beach',
		'nemo',
	],
	char: '🐠',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const fish = {
	keywords: [
		'animal',
		'food',
		'nature',
	],
	char: '🐟',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const blowfish = {
	keywords: [
		'animal',
		'nature',
		'food',
		'sea',
		'ocean',
	],
	char: '🐡',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const dolphin = {
	keywords: [
		'animal',
		'nature',
		'fish',
		'sea',
		'ocean',
		'flipper',
		'fins',
		'beach',
	],
	char: '🐬',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const shark = {
	keywords: [
		'animal',
		'nature',
		'fish',
		'sea',
		'ocean',
		'jaws',
		'fins',
		'beach',
	],
	char: '🦈',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const whale = {
	keywords: [
		'animal',
		'nature',
		'sea',
		'ocean',
	],
	char: '🐳',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const whale2 = {
	keywords: [
		'animal',
		'nature',
		'sea',
		'ocean',
	],
	char: '🐋',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const crocodile = {
	keywords: [
		'animal',
		'nature',
		'reptile',
		'lizard',
		'alligator',
	],
	char: '🐊',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const leopard = {
	keywords: [
		'animal',
		'nature',
	],
	char: '🐆',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const zebra = {
	keywords: [
		'animal',
		'nature',
		'stripes',
		'safari',
	],
	char: '🦓',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const tiger2 = {
	keywords: [
		'animal',
		'nature',
		'roar',
	],
	char: '🐅',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const water_buffalo = {
	keywords: [
		'animal',
		'nature',
		'ox',
		'cow',
	],
	char: '🐃',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const ox = {
	keywords: [
		'animal',
		'cow',
		'beef',
	],
	char: '🐂',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const cow2 = {
	keywords: [
		'beef',
		'ox',
		'animal',
		'nature',
		'moo',
		'milk',
	],
	char: '🐄',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const deer = {
	keywords: [
		'animal',
		'nature',
		'horns',
		'venison',
	],
	char: '🦌',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const dromedary_camel = {
	keywords: [
		'animal',
		'hot',
		'desert',
		'hump',
	],
	char: '🐪',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const camel = {
	keywords: [
		'animal',
		'nature',
		'hot',
		'desert',
		'hump',
	],
	char: '🐫',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const giraffe = {
	keywords: [
		'animal',
		'nature',
		'spots',
		'safari',
	],
	char: '🦒',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const elephant = {
	keywords: [
		'animal',
		'nature',
		'nose',
		'th',
		'circus',
	],
	char: '🐘',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const rhinoceros = {
	keywords: [
		'animal',
		'nature',
		'horn',
	],
	char: '🦏',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const goat = {
	keywords: [
		'animal',
		'nature',
	],
	char: '🐐',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const ram = {
	keywords: [
		'animal',
		'sheep',
		'nature',
	],
	char: '🐏',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const sheep = {
	keywords: [
		'animal',
		'nature',
		'wool',
		'shipit',
	],
	char: '🐑',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const racehorse = {
	keywords: [
		'animal',
		'gamble',
		'luck',
	],
	char: '🐎',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const pig2 = {
	keywords: [
		'animal',
		'nature',
	],
	char: '🐖',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const rat = {
	keywords: [
		'animal',
		'mouse',
		'rodent',
	],
	char: '🐀',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const mouse2 = {
	keywords: [
		'animal',
		'nature',
		'rodent',
	],
	char: '🐁',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const rooster = {
	keywords: [
		'animal',
		'nature',
		'chicken',
	],
	char: '🐓',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const turkey = {
	keywords: [
		'animal',
		'bird',
	],
	char: '🦃',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const dove = {
	keywords: [
		'animal',
		'bird',
	],
	char: '🕊',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const dog2 = {
	keywords: [
		'animal',
		'nature',
		'friend',
		'doge',
		'pet',
		'faithful',
	],
	char: '🐕',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const poodle = {
	keywords: [
		'dog',
		'animal',
		'101',
		'nature',
		'pet',
	],
	char: '🐩',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const cat2 = {
	keywords: [
		'animal',
		'meow',
		'pet',
		'cats',
	],
	char: '🐈',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const rabbit2 = {
	keywords: [
		'animal',
		'nature',
		'pet',
		'magic',
		'spring',
	],
	char: '🐇',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const chipmunk = {
	keywords: [
		'animal',
		'nature',
		'rodent',
		'squirrel',
	],
	char: '🐿',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const hedgehog = {
	keywords: [
		'animal',
		'nature',
		'spiny',
	],
	char: '🦔',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const raccoon = {
	keywords: [
		'animal',
		'nature',
	],
	char: '🦝',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const llama = {
	keywords: [
		'animal',
		'nature',
		'alpaca',
	],
	char: '🦙',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const hippopotamus = {
	keywords: [
		'animal',
		'nature',
	],
	char: '🦛',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const kangaroo = {
	keywords: [
		'animal',
		'nature',
		'australia',
		'joey',
		'hop',
		'marsupial',
	],
	char: '🦘',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const badger = {
	keywords: [
		'animal',
		'nature',
		'honey',
	],
	char: '🦡',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const swan = {
	keywords: [
		'animal',
		'nature',
		'bird',
	],
	char: '🦢',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const peacock = {
	keywords: [
		'animal',
		'nature',
		'peahen',
		'bird',
	],
	char: '🦚',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const parrot = {
	keywords: [
		'animal',
		'nature',
		'bird',
		'pirate',
		'talk',
	],
	char: '🦜',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const lobster = {
	keywords: [
		'animal',
		'nature',
		'bisque',
		'claws',
		'seafood',
	],
	char: '🦞',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const mosquito = {
	keywords: [
		'animal',
		'nature',
		'insect',
		'malaria',
	],
	char: '🦟',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const paw_prints = {
	keywords: [
		'animal',
		'tracking',
		'footprints',
		'dog',
		'cat',
		'pet',
		'feet',
	],
	char: '🐾',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const dragon = {
	keywords: [
		'animal',
		'myth',
		'nature',
		'chinese',
		'green',
	],
	char: '🐉',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const dragon_face = {
	keywords: [
		'animal',
		'myth',
		'nature',
		'chinese',
		'green',
	],
	char: '🐲',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const cactus = {
	keywords: [
		'vegetable',
		'plant',
		'nature',
	],
	char: '🌵',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const christmas_tree = {
	keywords: [
		'festival',
		'vacation',
		'december',
		'xmas',
		'celebration',
	],
	char: '🎄',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const evergreen_tree = {
	keywords: [
		'plant',
		'nature',
	],
	char: '🌲',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const deciduous_tree = {
	keywords: [
		'plant',
		'nature',
	],
	char: '🌳',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const palm_tree = {
	keywords: [
		'plant',
		'vegetable',
		'nature',
		'summer',
		'beach',
		'mojito',
		'tropical',
	],
	char: '🌴',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const seedling = {
	keywords: [
		'plant',
		'nature',
		'grass',
		'lawn',
		'spring',
	],
	char: '🌱',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const herb = {
	keywords: [
		'vegetable',
		'plant',
		'medicine',
		'weed',
		'grass',
		'lawn',
	],
	char: '🌿',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const shamrock = {
	keywords: [
		'vegetable',
		'plant',
		'nature',
		'irish',
		'clover',
	],
	char: '☘',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const four_leaf_clover = {
	keywords: [
		'vegetable',
		'plant',
		'nature',
		'lucky',
		'irish',
	],
	char: '🍀',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const bamboo = {
	keywords: [
		'plant',
		'nature',
		'vegetable',
		'panda',
		'pine_decoration',
	],
	char: '🎍',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const tanabata_tree = {
	keywords: [
		'plant',
		'nature',
		'branch',
		'summer',
	],
	char: '🎋',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const leaves = {
	keywords: [
		'nature',
		'plant',
		'tree',
		'vegetable',
		'grass',
		'lawn',
		'spring',
	],
	char: '🍃',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const fallen_leaf = {
	keywords: [
		'nature',
		'plant',
		'vegetable',
		'leaves',
	],
	char: '🍂',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const maple_leaf = {
	keywords: [
		'nature',
		'plant',
		'vegetable',
		'ca',
		'fall',
	],
	char: '🍁',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const ear_of_rice = {
	keywords: [
		'nature',
		'plant',
	],
	char: '🌾',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const hibiscus = {
	keywords: [
		'plant',
		'vegetable',
		'flowers',
		'beach',
	],
	char: '🌺',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const sunflower = {
	keywords: [
		'nature',
		'plant',
		'fall',
	],
	char: '🌻',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const rose = {
	keywords: [
		'flowers',
		'valentines',
		'love',
		'spring',
	],
	char: '🌹',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const wilted_flower = {
	keywords: [
		'plant',
		'nature',
		'flower',
	],
	char: '🥀',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const tulip = {
	keywords: [
		'flowers',
		'plant',
		'nature',
		'summer',
		'spring',
	],
	char: '🌷',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const blossom = {
	keywords: [
		'nature',
		'flowers',
		'yellow',
	],
	char: '🌼',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const cherry_blossom = {
	keywords: [
		'nature',
		'plant',
		'spring',
		'flower',
	],
	char: '🌸',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const bouquet = {
	keywords: [
		'flowers',
		'nature',
		'spring',
	],
	char: '💐',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const mushroom = {
	keywords: [
		'plant',
		'vegetable',
	],
	char: '🍄',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const chestnut = {
	keywords: [
		'food',
		'squirrel',
	],
	char: '🌰',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const jack_o_lantern = {
	keywords: [
		'halloween',
		'light',
		'pumpkin',
		'creepy',
		'fall',
	],
	char: '🎃',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const shell = {
	keywords: [
		'nature',
		'sea',
		'beach',
	],
	char: '🐚',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const spider_web = {
	keywords: [
		'animal',
		'insect',
		'arachnid',
		'silk',
	],
	char: '🕸',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const earth_americas = {
	keywords: [
		'globe',
		'world',
		'USA',
		'international',
	],
	char: '🌎',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const earth_africa = {
	keywords: [
		'globe',
		'world',
		'international',
	],
	char: '🌍',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const earth_asia = {
	keywords: [
		'globe',
		'world',
		'east',
		'international',
	],
	char: '🌏',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const full_moon = {
	keywords: [
		'nature',
		'yellow',
		'twilight',
		'planet',
		'space',
		'night',
		'evening',
		'sleep',
	],
	char: '🌕',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const waning_gibbous_moon = {
	keywords: [
		'nature',
		'twilight',
		'planet',
		'space',
		'night',
		'evening',
		'sleep',
		'waxing_gibbous_moon',
	],
	char: '🌖',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const last_quarter_moon = {
	keywords: [
		'nature',
		'twilight',
		'planet',
		'space',
		'night',
		'evening',
		'sleep',
	],
	char: '🌗',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const waning_crescent_moon = {
	keywords: [
		'nature',
		'twilight',
		'planet',
		'space',
		'night',
		'evening',
		'sleep',
	],
	char: '🌘',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const new_moon = {
	keywords: [
		'nature',
		'twilight',
		'planet',
		'space',
		'night',
		'evening',
		'sleep',
	],
	char: '🌑',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const waxing_crescent_moon = {
	keywords: [
		'nature',
		'twilight',
		'planet',
		'space',
		'night',
		'evening',
		'sleep',
	],
	char: '🌒',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const first_quarter_moon = {
	keywords: [
		'nature',
		'twilight',
		'planet',
		'space',
		'night',
		'evening',
		'sleep',
	],
	char: '🌓',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const waxing_gibbous_moon = {
	keywords: [
		'nature',
		'night',
		'sky',
		'gray',
		'twilight',
		'planet',
		'space',
		'evening',
		'sleep',
	],
	char: '🌔',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const new_moon_with_face = {
	keywords: [
		'nature',
		'twilight',
		'planet',
		'space',
		'night',
		'evening',
		'sleep',
	],
	char: '🌚',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const full_moon_with_face = {
	keywords: [
		'nature',
		'twilight',
		'planet',
		'space',
		'night',
		'evening',
		'sleep',
	],
	char: '🌝',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const first_quarter_moon_with_face = {
	keywords: [
		'nature',
		'twilight',
		'planet',
		'space',
		'night',
		'evening',
		'sleep',
	],
	char: '🌛',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const last_quarter_moon_with_face = {
	keywords: [
		'nature',
		'twilight',
		'planet',
		'space',
		'night',
		'evening',
		'sleep',
	],
	char: '🌜',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const sun_with_face = {
	keywords: [
		'nature',
		'morning',
		'sky',
	],
	char: '🌞',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const crescent_moon = {
	keywords: [
		'night',
		'sleep',
		'sky',
		'evening',
		'magic',
	],
	char: '🌙',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const star = {
	keywords: [
		'night',
		'yellow',
	],
	char: '⭐',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const star2 = {
	keywords: [
		'night',
		'sparkle',
		'awesome',
		'good',
		'magic',
	],
	char: '🌟',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const dizzy = {
	keywords: [
		'star',
		'sparkle',
		'shoot',
		'magic',
	],
	char: '💫',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const sparkles = {
	keywords: [
		'stars',
		'shine',
		'shiny',
		'cool',
		'awesome',
		'good',
		'magic',
	],
	char: '✨',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const comet = {
	keywords: [
		'space',
	],
	char: '☄',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const sunny = {
	keywords: [
		'weather',
		'nature',
		'brightness',
		'summer',
		'beach',
		'spring',
	],
	char: '☀️',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const sun_behind_small_cloud = {
	keywords: [
		'weather',
	],
	char: '🌤',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const partly_sunny = {
	keywords: [
		'weather',
		'nature',
		'cloudy',
		'morning',
		'fall',
		'spring',
	],
	char: '⛅',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const sun_behind_large_cloud = {
	keywords: [
		'weather',
	],
	char: '🌥',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const sun_behind_rain_cloud = {
	keywords: [
		'weather',
	],
	char: '🌦',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const cloud = {
	keywords: [
		'weather',
		'sky',
	],
	char: '☁️',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const cloud_with_rain = {
	keywords: [
		'weather',
	],
	char: '🌧',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const cloud_with_lightning_and_rain = {
	keywords: [
		'weather',
		'lightning',
	],
	char: '⛈',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const cloud_with_lightning = {
	keywords: [
		'weather',
		'thunder',
	],
	char: '🌩',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const zap = {
	keywords: [
		'thunder',
		'weather',
		'lightning bolt',
		'fast',
	],
	char: '⚡',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const fire = {
	keywords: [
		'hot',
		'cook',
		'flame',
	],
	char: '🔥',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const boom = {
	keywords: [
		'bomb',
		'explode',
		'explosion',
		'collision',
		'blown',
	],
	char: '💥',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const snowflake = {
	keywords: [
		'winter',
		'season',
		'cold',
		'weather',
		'christmas',
		'xmas',
	],
	char: '❄️',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const cloud_with_snow = {
	keywords: [
		'weather',
	],
	char: '🌨',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const snowman = {
	keywords: [
		'winter',
		'season',
		'cold',
		'weather',
		'christmas',
		'xmas',
		'frozen',
		'without_snow',
	],
	char: '⛄',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const snowman_with_snow = {
	keywords: [
		'winter',
		'season',
		'cold',
		'weather',
		'christmas',
		'xmas',
		'frozen',
	],
	char: '☃',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const wind_face = {
	keywords: [
		'gust',
		'air',
	],
	char: '🌬',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const dash = {
	keywords: [
		'wind',
		'air',
		'fast',
		'shoo',
		'fart',
		'smoke',
		'puff',
	],
	char: '💨',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const tornado = {
	keywords: [
		'weather',
		'cyclone',
		'twister',
	],
	char: '🌪',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const fog = {
	keywords: [
		'weather',
	],
	char: '🌫',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const open_umbrella = {
	keywords: [
		'weather',
		'spring',
	],
	char: '☂',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const umbrella = {
	keywords: [
		'rainy',
		'weather',
		'spring',
	],
	char: '☔',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const droplet = {
	keywords: [
		'water',
		'drip',
		'faucet',
		'spring',
	],
	char: '💧',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const sweat_drops = {
	keywords: [
		'water',
		'drip',
		'oops',
	],
	char: '💦',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const ocean = {
	keywords: [
		'sea',
		'water',
		'wave',
		'nature',
		'tsunami',
		'disaster',
	],
	char: '🌊',
	fitzpatrick_scale: false,
	category: 'animals_and_nature',
};
const green_apple = {
	keywords: [
		'fruit',
		'nature',
	],
	char: '🍏',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const apple = {
	keywords: [
		'fruit',
		'mac',
		'school',
	],
	char: '🍎',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const pear = {
	keywords: [
		'fruit',
		'nature',
		'food',
	],
	char: '🍐',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const tangerine = {
	keywords: [
		'food',
		'fruit',
		'nature',
		'orange',
	],
	char: '🍊',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const lemon = {
	keywords: [
		'fruit',
		'nature',
	],
	char: '🍋',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const banana = {
	keywords: [
		'fruit',
		'food',
		'monkey',
	],
	char: '🍌',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const watermelon = {
	keywords: [
		'fruit',
		'food',
		'picnic',
		'summer',
	],
	char: '🍉',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const grapes = {
	keywords: [
		'fruit',
		'food',
		'wine',
	],
	char: '🍇',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const strawberry = {
	keywords: [
		'fruit',
		'food',
		'nature',
	],
	char: '🍓',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const melon = {
	keywords: [
		'fruit',
		'nature',
		'food',
	],
	char: '🍈',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const cherries = {
	keywords: [
		'food',
		'fruit',
	],
	char: '🍒',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const peach = {
	keywords: [
		'fruit',
		'nature',
		'food',
	],
	char: '🍑',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const pineapple = {
	keywords: [
		'fruit',
		'nature',
		'food',
	],
	char: '🍍',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const coconut = {
	keywords: [
		'fruit',
		'nature',
		'food',
		'palm',
	],
	char: '🥥',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const kiwi_fruit = {
	keywords: [
		'fruit',
		'food',
	],
	char: '🥝',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const mango = {
	keywords: [
		'fruit',
		'food',
		'tropical',
	],
	char: '🥭',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const avocado = {
	keywords: [
		'fruit',
		'food',
	],
	char: '🥑',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const broccoli = {
	keywords: [
		'fruit',
		'food',
		'vegetable',
	],
	char: '🥦',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const tomato = {
	keywords: [
		'fruit',
		'vegetable',
		'nature',
		'food',
	],
	char: '🍅',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const eggplant = {
	keywords: [
		'vegetable',
		'nature',
		'food',
		'aubergine',
	],
	char: '🍆',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const cucumber = {
	keywords: [
		'fruit',
		'food',
		'pickle',
	],
	char: '🥒',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const carrot = {
	keywords: [
		'vegetable',
		'food',
		'orange',
	],
	char: '🥕',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const hot_pepper = {
	keywords: [
		'food',
		'spicy',
		'chilli',
		'chili',
	],
	char: '🌶',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const potato = {
	keywords: [
		'food',
		'tuber',
		'vegatable',
		'starch',
	],
	char: '🥔',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const corn = {
	keywords: [
		'food',
		'vegetable',
		'plant',
	],
	char: '🌽',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const leafy_greens = {
	keywords: [
		'food',
		'vegetable',
		'plant',
		'bok choy',
		'cabbage',
		'kale',
		'lettuce',
	],
	char: '🥬',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const sweet_potato = {
	keywords: [
		'food',
		'nature',
	],
	char: '🍠',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const peanuts = {
	keywords: [
		'food',
		'nut',
	],
	char: '🥜',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const honey_pot = {
	keywords: [
		'bees',
		'sweet',
		'kitchen',
	],
	char: '🍯',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const croissant = {
	keywords: [
		'food',
		'bread',
		'french',
	],
	char: '🥐',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const bread = {
	keywords: [
		'food',
		'wheat',
		'breakfast',
		'toast',
	],
	char: '🍞',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const baguette_bread = {
	keywords: [
		'food',
		'bread',
		'french',
	],
	char: '🥖',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const bagel = {
	keywords: [
		'food',
		'bread',
		'bakery',
		'schmear',
	],
	char: '🥯',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const pretzel = {
	keywords: [
		'food',
		'bread',
		'twisted',
	],
	char: '🥨',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const cheese = {
	keywords: [
		'food',
		'chadder',
	],
	char: '🧀',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const egg = {
	keywords: [
		'food',
		'chicken',
		'breakfast',
	],
	char: '🥚',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const bacon = {
	keywords: [
		'food',
		'breakfast',
		'pork',
		'pig',
		'meat',
	],
	char: '🥓',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const steak = {
	keywords: [
		'food',
		'cow',
		'meat',
		'cut',
		'chop',
		'lambchop',
		'porkchop',
	],
	char: '🥩',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const pancakes = {
	keywords: [
		'food',
		'breakfast',
		'flapjacks',
		'hotcakes',
	],
	char: '🥞',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const poultry_leg = {
	keywords: [
		'food',
		'meat',
		'drumstick',
		'bird',
		'chicken',
		'turkey',
	],
	char: '🍗',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const meat_on_bone = {
	keywords: [
		'good',
		'food',
		'drumstick',
	],
	char: '🍖',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const bone = {
	keywords: [
		'skeleton',
	],
	char: '🦴',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const fried_shrimp = {
	keywords: [
		'food',
		'animal',
		'appetizer',
		'summer',
	],
	char: '🍤',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const fried_egg = {
	keywords: [
		'food',
		'breakfast',
		'kitchen',
		'egg',
	],
	char: '🍳',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const hamburger = {
	keywords: [
		'meat',
		'fast food',
		'beef',
		'cheeseburger',
		'mcdonalds',
		'burger king',
	],
	char: '🍔',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const fries = {
	keywords: [
		'chips',
		'snack',
		'fast food',
	],
	char: '🍟',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const stuffed_flatbread = {
	keywords: [
		'food',
		'flatbread',
		'stuffed',
		'gyro',
	],
	char: '🥙',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const hotdog = {
	keywords: [
		'food',
		'frankfurter',
	],
	char: '🌭',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const pizza = {
	keywords: [
		'food',
		'party',
	],
	char: '🍕',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const sandwich = {
	keywords: [
		'food',
		'lunch',
		'bread',
	],
	char: '🥪',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const canned_food = {
	keywords: [
		'food',
		'soup',
	],
	char: '🥫',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const spaghetti = {
	keywords: [
		'food',
		'italian',
		'noodle',
	],
	char: '🍝',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const taco = {
	keywords: [
		'food',
		'mexican',
	],
	char: '🌮',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const burrito = {
	keywords: [
		'food',
		'mexican',
	],
	char: '🌯',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const green_salad = {
	keywords: [
		'food',
		'healthy',
		'lettuce',
	],
	char: '🥗',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const shallow_pan_of_food = {
	keywords: [
		'food',
		'cooking',
		'casserole',
		'paella',
	],
	char: '🥘',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const ramen = {
	keywords: [
		'food',
		'japanese',
		'noodle',
		'chopsticks',
	],
	char: '🍜',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const stew = {
	keywords: [
		'food',
		'meat',
		'soup',
	],
	char: '🍲',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const fish_cake = {
	keywords: [
		'food',
		'japan',
		'sea',
		'beach',
		'narutomaki',
		'pink',
		'swirl',
		'kamaboko',
		'surimi',
		'ramen',
	],
	char: '🍥',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const fortune_cookie = {
	keywords: [
		'food',
		'prophecy',
	],
	char: '🥠',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const sushi = {
	keywords: [
		'food',
		'fish',
		'japanese',
		'rice',
	],
	char: '🍣',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const bento = {
	keywords: [
		'food',
		'japanese',
		'box',
	],
	char: '🍱',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const curry = {
	keywords: [
		'food',
		'spicy',
		'hot',
		'indian',
	],
	char: '🍛',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const rice_ball = {
	keywords: [
		'food',
		'japanese',
	],
	char: '🍙',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const rice = {
	keywords: [
		'food',
		'china',
		'asian',
	],
	char: '🍚',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const rice_cracker = {
	keywords: [
		'food',
		'japanese',
	],
	char: '🍘',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const oden = {
	keywords: [
		'food',
		'japanese',
	],
	char: '🍢',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const dango = {
	keywords: [
		'food',
		'dessert',
		'sweet',
		'japanese',
		'barbecue',
		'meat',
	],
	char: '🍡',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const shaved_ice = {
	keywords: [
		'hot',
		'dessert',
		'summer',
	],
	char: '🍧',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const ice_cream = {
	keywords: [
		'food',
		'hot',
		'dessert',
	],
	char: '🍨',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const icecream = {
	keywords: [
		'food',
		'hot',
		'dessert',
		'summer',
	],
	char: '🍦',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const pie = {
	keywords: [
		'food',
		'dessert',
		'pastry',
	],
	char: '🥧',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const cake = {
	keywords: [
		'food',
		'dessert',
	],
	char: '🍰',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const cupcake = {
	keywords: [
		'food',
		'dessert',
		'bakery',
		'sweet',
	],
	char: '🧁',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const moon_cake = {
	keywords: [
		'food',
		'autumn',
	],
	char: '🥮',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const birthday = {
	keywords: [
		'food',
		'dessert',
		'cake',
	],
	char: '🎂',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const custard = {
	keywords: [
		'dessert',
		'food',
	],
	char: '🍮',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const candy = {
	keywords: [
		'snack',
		'dessert',
		'sweet',
		'lolly',
	],
	char: '🍬',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const lollipop = {
	keywords: [
		'food',
		'snack',
		'candy',
		'sweet',
	],
	char: '🍭',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const chocolate_bar = {
	keywords: [
		'food',
		'snack',
		'dessert',
		'sweet',
	],
	char: '🍫',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const popcorn = {
	keywords: [
		'food',
		'movie theater',
		'films',
		'snack',
	],
	char: '🍿',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const dumpling = {
	keywords: [
		'food',
		'empanada',
		'pierogi',
		'potsticker',
	],
	char: '🥟',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const doughnut = {
	keywords: [
		'food',
		'dessert',
		'snack',
		'sweet',
		'donut',
	],
	char: '🍩',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const cookie = {
	keywords: [
		'food',
		'snack',
		'oreo',
		'chocolate',
		'sweet',
		'dessert',
	],
	char: '🍪',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const milk_glass = {
	keywords: [
		'beverage',
		'drink',
		'cow',
	],
	char: '🥛',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const beer = {
	keywords: [
		'relax',
		'beverage',
		'drink',
		'drunk',
		'party',
		'pub',
		'summer',
		'alcohol',
		'booze',
	],
	char: '🍺',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const beers = {
	keywords: [
		'relax',
		'beverage',
		'drink',
		'drunk',
		'party',
		'pub',
		'summer',
		'alcohol',
		'booze',
	],
	char: '🍻',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const clinking_glasses = {
	keywords: [
		'beverage',
		'drink',
		'party',
		'alcohol',
		'celebrate',
		'cheers',
		'wine',
		'champagne',
		'toast',
	],
	char: '🥂',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const wine_glass = {
	keywords: [
		'drink',
		'beverage',
		'drunk',
		'alcohol',
		'booze',
	],
	char: '🍷',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const tumbler_glass = {
	keywords: [
		'drink',
		'beverage',
		'drunk',
		'alcohol',
		'liquor',
		'booze',
		'bourbon',
		'scotch',
		'whisky',
		'glass',
		'shot',
	],
	char: '🥃',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const cocktail = {
	keywords: [
		'drink',
		'drunk',
		'alcohol',
		'beverage',
		'booze',
		'mojito',
	],
	char: '🍸',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const tropical_drink = {
	keywords: [
		'beverage',
		'cocktail',
		'summer',
		'beach',
		'alcohol',
		'booze',
		'mojito',
	],
	char: '🍹',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const champagne = {
	keywords: [
		'drink',
		'wine',
		'bottle',
		'celebration',
	],
	char: '🍾',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const sake = {
	keywords: [
		'wine',
		'drink',
		'drunk',
		'beverage',
		'japanese',
		'alcohol',
		'booze',
	],
	char: '🍶',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const tea = {
	keywords: [
		'drink',
		'bowl',
		'breakfast',
		'green',
		'british',
	],
	char: '🍵',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const cup_with_straw = {
	keywords: [
		'drink',
		'soda',
	],
	char: '🥤',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const coffee = {
	keywords: [
		'beverage',
		'caffeine',
		'latte',
		'espresso',
	],
	char: '☕',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const baby_bottle = {
	keywords: [
		'food',
		'container',
		'milk',
	],
	char: '🍼',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const salt = {
	keywords: [
		'condiment',
		'shaker',
	],
	char: '🧂',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const spoon = {
	keywords: [
		'cutlery',
		'kitchen',
		'tableware',
	],
	char: '🥄',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const fork_and_knife = {
	keywords: [
		'cutlery',
		'kitchen',
	],
	char: '🍴',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const plate_with_cutlery = {
	keywords: [
		'food',
		'eat',
		'meal',
		'lunch',
		'dinner',
		'restaurant',
	],
	char: '🍽',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const bowl_with_spoon = {
	keywords: [
		'food',
		'breakfast',
		'cereal',
		'oatmeal',
		'porridge',
	],
	char: '🥣',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const takeout_box = {
	keywords: [
		'food',
		'leftovers',
	],
	char: '🥡',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const chopsticks = {
	keywords: [
		'food',
	],
	char: '🥢',
	fitzpatrick_scale: false,
	category: 'food_and_drink',
};
const soccer = {
	keywords: [
		'sports',
		'football',
	],
	char: '⚽',
	fitzpatrick_scale: false,
	category: 'activity',
};
const basketball = {
	keywords: [
		'sports',
		'balls',
		'NBA',
	],
	char: '🏀',
	fitzpatrick_scale: false,
	category: 'activity',
};
const football = {
	keywords: [
		'sports',
		'balls',
		'NFL',
	],
	char: '🏈',
	fitzpatrick_scale: false,
	category: 'activity',
};
const baseball = {
	keywords: [
		'sports',
		'balls',
	],
	char: '⚾',
	fitzpatrick_scale: false,
	category: 'activity',
};
const softball = {
	keywords: [
		'sports',
		'balls',
	],
	char: '🥎',
	fitzpatrick_scale: false,
	category: 'activity',
};
const tennis = {
	keywords: [
		'sports',
		'balls',
		'green',
	],
	char: '🎾',
	fitzpatrick_scale: false,
	category: 'activity',
};
const volleyball = {
	keywords: [
		'sports',
		'balls',
	],
	char: '🏐',
	fitzpatrick_scale: false,
	category: 'activity',
};
const rugby_football = {
	keywords: [
		'sports',
		'team',
	],
	char: '🏉',
	fitzpatrick_scale: false,
	category: 'activity',
};
const flying_disc = {
	keywords: [
		'sports',
		'frisbee',
		'ultimate',
	],
	char: '🥏',
	fitzpatrick_scale: false,
	category: 'activity',
};
const golf = {
	keywords: [
		'sports',
		'business',
		'flag',
		'hole',
		'summer',
	],
	char: '⛳',
	fitzpatrick_scale: false,
	category: 'activity',
};
const golfing_woman = {
	keywords: [
		'sports',
		'business',
		'woman',
		'female',
	],
	char: '🏌️‍♀️',
	fitzpatrick_scale: false,
	category: 'activity',
};
const golfing_man = {
	keywords: [
		'sports',
		'business',
	],
	char: '🏌',
	fitzpatrick_scale: true,
	category: 'activity',
};
const ping_pong = {
	keywords: [
		'sports',
		'pingpong',
	],
	char: '🏓',
	fitzpatrick_scale: false,
	category: 'activity',
};
const badminton = {
	keywords: [
		'sports',
	],
	char: '🏸',
	fitzpatrick_scale: false,
	category: 'activity',
};
const goal_net = {
	keywords: [
		'sports',
	],
	char: '🥅',
	fitzpatrick_scale: false,
	category: 'activity',
};
const ice_hockey = {
	keywords: [
		'sports',
	],
	char: '🏒',
	fitzpatrick_scale: false,
	category: 'activity',
};
const field_hockey = {
	keywords: [
		'sports',
	],
	char: '🏑',
	fitzpatrick_scale: false,
	category: 'activity',
};
const lacrosse = {
	keywords: [
		'sports',
		'ball',
		'stick',
	],
	char: '🥍',
	fitzpatrick_scale: false,
	category: 'activity',
};
const cricket = {
	keywords: [
		'sports',
	],
	char: '🏏',
	fitzpatrick_scale: false,
	category: 'activity',
};
const ski = {
	keywords: [
		'sports',
		'winter',
		'cold',
		'snow',
	],
	char: '🎿',
	fitzpatrick_scale: false,
	category: 'activity',
};
const skier = {
	keywords: [
		'sports',
		'winter',
		'snow',
	],
	char: '⛷',
	fitzpatrick_scale: false,
	category: 'activity',
};
const snowboarder = {
	keywords: [
		'sports',
		'winter',
	],
	char: '🏂',
	fitzpatrick_scale: true,
	category: 'activity',
};
const person_fencing = {
	keywords: [
		'sports',
		'fencing',
		'sword',
	],
	char: '🤺',
	fitzpatrick_scale: false,
	category: 'activity',
};
const women_wrestling = {
	keywords: [
		'sports',
		'wrestlers',
	],
	char: '🤼‍♀️',
	fitzpatrick_scale: false,
	category: 'activity',
};
const men_wrestling = {
	keywords: [
		'sports',
		'wrestlers',
	],
	char: '🤼‍♂️',
	fitzpatrick_scale: false,
	category: 'activity',
};
const woman_cartwheeling = {
	keywords: [
		'gymnastics',
	],
	char: '🤸‍♀️',
	fitzpatrick_scale: true,
	category: 'activity',
};
const man_cartwheeling = {
	keywords: [
		'gymnastics',
	],
	char: '🤸‍♂️',
	fitzpatrick_scale: true,
	category: 'activity',
};
const woman_playing_handball = {
	keywords: [
		'sports',
	],
	char: '🤾‍♀️',
	fitzpatrick_scale: true,
	category: 'activity',
};
const man_playing_handball = {
	keywords: [
		'sports',
	],
	char: '🤾‍♂️',
	fitzpatrick_scale: true,
	category: 'activity',
};
const ice_skate = {
	keywords: [
		'sports',
	],
	char: '⛸',
	fitzpatrick_scale: false,
	category: 'activity',
};
const curling_stone = {
	keywords: [
		'sports',
	],
	char: '🥌',
	fitzpatrick_scale: false,
	category: 'activity',
};
const skateboard = {
	keywords: [
		'board',
	],
	char: '🛹',
	fitzpatrick_scale: false,
	category: 'activity',
};
const sled = {
	keywords: [
		'sleigh',
		'luge',
		'toboggan',
	],
	char: '🛷',
	fitzpatrick_scale: false,
	category: 'activity',
};
const bow_and_arrow = {
	keywords: [
		'sports',
	],
	char: '🏹',
	fitzpatrick_scale: false,
	category: 'activity',
};
const fishing_pole_and_fish = {
	keywords: [
		'food',
		'hobby',
		'summer',
	],
	char: '🎣',
	fitzpatrick_scale: false,
	category: 'activity',
};
const boxing_glove = {
	keywords: [
		'sports',
		'fighting',
	],
	char: '🥊',
	fitzpatrick_scale: false,
	category: 'activity',
};
const martial_arts_uniform = {
	keywords: [
		'judo',
		'karate',
		'taekwondo',
	],
	char: '🥋',
	fitzpatrick_scale: false,
	category: 'activity',
};
const rowing_woman = {
	keywords: [
		'sports',
		'hobby',
		'water',
		'ship',
		'woman',
		'female',
	],
	char: '🚣‍♀️',
	fitzpatrick_scale: true,
	category: 'activity',
};
const rowing_man = {
	keywords: [
		'sports',
		'hobby',
		'water',
		'ship',
	],
	char: '🚣',
	fitzpatrick_scale: true,
	category: 'activity',
};
const climbing_woman = {
	keywords: [
		'sports',
		'hobby',
		'woman',
		'female',
		'rock',
	],
	char: '🧗‍♀️',
	fitzpatrick_scale: true,
	category: 'activity',
};
const climbing_man = {
	keywords: [
		'sports',
		'hobby',
		'man',
		'male',
		'rock',
	],
	char: '🧗‍♂️',
	fitzpatrick_scale: true,
	category: 'activity',
};
const swimming_woman = {
	keywords: [
		'sports',
		'exercise',
		'human',
		'athlete',
		'water',
		'summer',
		'woman',
		'female',
	],
	char: '🏊‍♀️',
	fitzpatrick_scale: true,
	category: 'activity',
};
const swimming_man = {
	keywords: [
		'sports',
		'exercise',
		'human',
		'athlete',
		'water',
		'summer',
	],
	char: '🏊',
	fitzpatrick_scale: true,
	category: 'activity',
};
const woman_playing_water_polo = {
	keywords: [
		'sports',
		'pool',
	],
	char: '🤽‍♀️',
	fitzpatrick_scale: true,
	category: 'activity',
};
const man_playing_water_polo = {
	keywords: [
		'sports',
		'pool',
	],
	char: '🤽‍♂️',
	fitzpatrick_scale: true,
	category: 'activity',
};
const woman_in_lotus_position = {
	keywords: [
		'woman',
		'female',
		'meditation',
		'yoga',
		'serenity',
		'zen',
		'mindfulness',
	],
	char: '🧘‍♀️',
	fitzpatrick_scale: true,
	category: 'activity',
};
const man_in_lotus_position = {
	keywords: [
		'man',
		'male',
		'meditation',
		'yoga',
		'serenity',
		'zen',
		'mindfulness',
	],
	char: '🧘‍♂️',
	fitzpatrick_scale: true,
	category: 'activity',
};
const surfing_woman = {
	keywords: [
		'sports',
		'ocean',
		'sea',
		'summer',
		'beach',
		'woman',
		'female',
	],
	char: '🏄‍♀️',
	fitzpatrick_scale: true,
	category: 'activity',
};
const surfing_man = {
	keywords: [
		'sports',
		'ocean',
		'sea',
		'summer',
		'beach',
	],
	char: '🏄',
	fitzpatrick_scale: true,
	category: 'activity',
};
const bath = {
	keywords: [
		'clean',
		'shower',
		'bathroom',
	],
	char: '🛀',
	fitzpatrick_scale: true,
	category: 'activity',
};
const basketball_woman = {
	keywords: [
		'sports',
		'human',
		'woman',
		'female',
	],
	char: '⛹️‍♀️',
	fitzpatrick_scale: true,
	category: 'activity',
};
const basketball_man = {
	keywords: [
		'sports',
		'human',
	],
	char: '⛹',
	fitzpatrick_scale: true,
	category: 'activity',
};
const weight_lifting_woman = {
	keywords: [
		'sports',
		'training',
		'exercise',
		'woman',
		'female',
	],
	char: '🏋️‍♀️',
	fitzpatrick_scale: true,
	category: 'activity',
};
const weight_lifting_man = {
	keywords: [
		'sports',
		'training',
		'exercise',
	],
	char: '🏋',
	fitzpatrick_scale: true,
	category: 'activity',
};
const biking_woman = {
	keywords: [
		'sports',
		'bike',
		'exercise',
		'hipster',
		'woman',
		'female',
	],
	char: '🚴‍♀️',
	fitzpatrick_scale: true,
	category: 'activity',
};
const biking_man = {
	keywords: [
		'sports',
		'bike',
		'exercise',
		'hipster',
	],
	char: '🚴',
	fitzpatrick_scale: true,
	category: 'activity',
};
const mountain_biking_woman = {
	keywords: [
		'transportation',
		'sports',
		'human',
		'race',
		'bike',
		'woman',
		'female',
	],
	char: '🚵‍♀️',
	fitzpatrick_scale: true,
	category: 'activity',
};
const mountain_biking_man = {
	keywords: [
		'transportation',
		'sports',
		'human',
		'race',
		'bike',
	],
	char: '🚵',
	fitzpatrick_scale: true,
	category: 'activity',
};
const horse_racing = {
	keywords: [
		'animal',
		'betting',
		'competition',
		'gambling',
		'luck',
	],
	char: '🏇',
	fitzpatrick_scale: true,
	category: 'activity',
};
const business_suit_levitating = {
	keywords: [
		'suit',
		'business',
		'levitate',
		'hover',
		'jump',
	],
	char: '🕴',
	fitzpatrick_scale: true,
	category: 'activity',
};
const trophy = {
	keywords: [
		'win',
		'award',
		'contest',
		'place',
		'ftw',
		'ceremony',
	],
	char: '🏆',
	fitzpatrick_scale: false,
	category: 'activity',
};
const running_shirt_with_sash = {
	keywords: [
		'play',
		'pageant',
	],
	char: '🎽',
	fitzpatrick_scale: false,
	category: 'activity',
};
const medal_sports = {
	keywords: [
		'award',
		'winning',
	],
	char: '🏅',
	fitzpatrick_scale: false,
	category: 'activity',
};
const medal_military = {
	keywords: [
		'award',
		'winning',
		'army',
	],
	char: '🎖',
	fitzpatrick_scale: false,
	category: 'activity',
};
const reminder_ribbon = {
	keywords: [
		'sports',
		'cause',
		'support',
		'awareness',
	],
	char: '🎗',
	fitzpatrick_scale: false,
	category: 'activity',
};
const rosette = {
	keywords: [
		'flower',
		'decoration',
		'military',
	],
	char: '🏵',
	fitzpatrick_scale: false,
	category: 'activity',
};
const ticket = {
	keywords: [
		'event',
		'concert',
		'pass',
	],
	char: '🎫',
	fitzpatrick_scale: false,
	category: 'activity',
};
const tickets = {
	keywords: [
		'sports',
		'concert',
		'entrance',
	],
	char: '🎟',
	fitzpatrick_scale: false,
	category: 'activity',
};
const performing_arts = {
	keywords: [
		'acting',
		'theater',
		'drama',
	],
	char: '🎭',
	fitzpatrick_scale: false,
	category: 'activity',
};
const art = {
	keywords: [
		'design',
		'paint',
		'draw',
		'colors',
	],
	char: '🎨',
	fitzpatrick_scale: false,
	category: 'activity',
};
const circus_tent = {
	keywords: [
		'festival',
		'carnival',
		'party',
	],
	char: '🎪',
	fitzpatrick_scale: false,
	category: 'activity',
};
const woman_juggling = {
	keywords: [
		'juggle',
		'balance',
		'skill',
		'multitask',
	],
	char: '🤹‍♀️',
	fitzpatrick_scale: true,
	category: 'activity',
};
const man_juggling = {
	keywords: [
		'juggle',
		'balance',
		'skill',
		'multitask',
	],
	char: '🤹‍♂️',
	fitzpatrick_scale: true,
	category: 'activity',
};
const microphone = {
	keywords: [
		'sound',
		'music',
		'PA',
		'sing',
		'talkshow',
	],
	char: '🎤',
	fitzpatrick_scale: false,
	category: 'activity',
};
const headphones = {
	keywords: [
		'music',
		'score',
		'gadgets',
	],
	char: '🎧',
	fitzpatrick_scale: false,
	category: 'activity',
};
const musical_score = {
	keywords: [
		'treble',
		'clef',
		'compose',
	],
	char: '🎼',
	fitzpatrick_scale: false,
	category: 'activity',
};
const musical_keyboard = {
	keywords: [
		'piano',
		'instrument',
		'compose',
	],
	char: '🎹',
	fitzpatrick_scale: false,
	category: 'activity',
};
const drum = {
	keywords: [
		'music',
		'instrument',
		'drumsticks',
		'snare',
	],
	char: '🥁',
	fitzpatrick_scale: false,
	category: 'activity',
};
const saxophone = {
	keywords: [
		'music',
		'instrument',
		'jazz',
		'blues',
	],
	char: '🎷',
	fitzpatrick_scale: false,
	category: 'activity',
};
const trumpet = {
	keywords: [
		'music',
		'brass',
	],
	char: '🎺',
	fitzpatrick_scale: false,
	category: 'activity',
};
const guitar = {
	keywords: [
		'music',
		'instrument',
	],
	char: '🎸',
	fitzpatrick_scale: false,
	category: 'activity',
};
const violin = {
	keywords: [
		'music',
		'instrument',
		'orchestra',
		'symphony',
	],
	char: '🎻',
	fitzpatrick_scale: false,
	category: 'activity',
};
const clapper = {
	keywords: [
		'movie',
		'film',
		'record',
	],
	char: '🎬',
	fitzpatrick_scale: false,
	category: 'activity',
};
const video_game = {
	keywords: [
		'play',
		'console',
		'PS4',
		'controller',
	],
	char: '🎮',
	fitzpatrick_scale: false,
	category: 'activity',
};
const space_invader = {
	keywords: [
		'game',
		'arcade',
		'play',
	],
	char: '👾',
	fitzpatrick_scale: false,
	category: 'activity',
};
const dart = {
	keywords: [
		'game',
		'play',
		'bar',
		'target',
		'bullseye',
	],
	char: '🎯',
	fitzpatrick_scale: false,
	category: 'activity',
};
const game_die = {
	keywords: [
		'dice',
		'random',
		'tabletop',
		'play',
		'luck',
	],
	char: '🎲',
	fitzpatrick_scale: false,
	category: 'activity',
};
const chess_pawn = {
	keywords: [
		'expendable',
	],
	char: '♟',
	fitzpatrick_scale: false,
	category: 'activity',
};
const slot_machine = {
	keywords: [
		'bet',
		'gamble',
		'vegas',
		'fruit machine',
		'luck',
		'casino',
	],
	char: '🎰',
	fitzpatrick_scale: false,
	category: 'activity',
};
const jigsaw = {
	keywords: [
		'interlocking',
		'puzzle',
		'piece',
	],
	char: '🧩',
	fitzpatrick_scale: false,
	category: 'activity',
};
const bowling = {
	keywords: [
		'sports',
		'fun',
		'play',
	],
	char: '🎳',
	fitzpatrick_scale: false,
	category: 'activity',
};
const red_car = {
	keywords: [
		'red',
		'transportation',
		'vehicle',
	],
	char: '🚗',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const taxi = {
	keywords: [
		'uber',
		'vehicle',
		'cars',
		'transportation',
	],
	char: '🚕',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const blue_car = {
	keywords: [
		'transportation',
		'vehicle',
	],
	char: '🚙',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const bus = {
	keywords: [
		'car',
		'vehicle',
		'transportation',
	],
	char: '🚌',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const trolleybus = {
	keywords: [
		'bart',
		'transportation',
		'vehicle',
	],
	char: '🚎',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const racing_car = {
	keywords: [
		'sports',
		'race',
		'fast',
		'formula',
		'f1',
	],
	char: '🏎',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const police_car = {
	keywords: [
		'vehicle',
		'cars',
		'transportation',
		'law',
		'legal',
		'enforcement',
	],
	char: '🚓',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const ambulance = {
	keywords: [
		'health',
		'911',
		'hospital',
	],
	char: '🚑',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const fire_engine = {
	keywords: [
		'transportation',
		'cars',
		'vehicle',
	],
	char: '🚒',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const minibus = {
	keywords: [
		'vehicle',
		'car',
		'transportation',
	],
	char: '🚐',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const truck = {
	keywords: [
		'cars',
		'transportation',
	],
	char: '🚚',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const articulated_lorry = {
	keywords: [
		'vehicle',
		'cars',
		'transportation',
		'express',
	],
	char: '🚛',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const tractor = {
	keywords: [
		'vehicle',
		'car',
		'farming',
		'agriculture',
	],
	char: '🚜',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const kick_scooter = {
	keywords: [
		'vehicle',
		'kick',
		'razor',
	],
	char: '🛴',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const motorcycle = {
	keywords: [
		'race',
		'sports',
		'fast',
	],
	char: '🏍',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const bike = {
	keywords: [
		'sports',
		'bicycle',
		'exercise',
		'hipster',
	],
	char: '🚲',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const motor_scooter = {
	keywords: [
		'vehicle',
		'vespa',
		'sasha',
	],
	char: '🛵',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const rotating_light = {
	keywords: [
		'police',
		'ambulance',
		'911',
		'emergency',
		'alert',
		'error',
		'pinged',
		'law',
		'legal',
	],
	char: '🚨',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const oncoming_police_car = {
	keywords: [
		'vehicle',
		'law',
		'legal',
		'enforcement',
		'911',
	],
	char: '🚔',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const oncoming_bus = {
	keywords: [
		'vehicle',
		'transportation',
	],
	char: '🚍',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const oncoming_automobile = {
	keywords: [
		'car',
		'vehicle',
		'transportation',
	],
	char: '🚘',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const oncoming_taxi = {
	keywords: [
		'vehicle',
		'cars',
		'uber',
	],
	char: '🚖',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const aerial_tramway = {
	keywords: [
		'transportation',
		'vehicle',
		'ski',
	],
	char: '🚡',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const mountain_cableway = {
	keywords: [
		'transportation',
		'vehicle',
		'ski',
	],
	char: '🚠',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const suspension_railway = {
	keywords: [
		'vehicle',
		'transportation',
	],
	char: '🚟',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const railway_car = {
	keywords: [
		'transportation',
		'vehicle',
	],
	char: '🚃',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const train = {
	keywords: [
		'transportation',
		'vehicle',
		'carriage',
		'public',
		'travel',
	],
	char: '🚋',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const monorail = {
	keywords: [
		'transportation',
		'vehicle',
	],
	char: '🚝',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const bullettrain_side = {
	keywords: [
		'transportation',
		'vehicle',
	],
	char: '🚄',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const bullettrain_front = {
	keywords: [
		'transportation',
		'vehicle',
		'speed',
		'fast',
		'public',
		'travel',
	],
	char: '🚅',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const light_rail = {
	keywords: [
		'transportation',
		'vehicle',
	],
	char: '🚈',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const mountain_railway = {
	keywords: [
		'transportation',
		'vehicle',
	],
	char: '🚞',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const steam_locomotive = {
	keywords: [
		'transportation',
		'vehicle',
		'train',
	],
	char: '🚂',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const train2 = {
	keywords: [
		'transportation',
		'vehicle',
	],
	char: '🚆',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const metro = {
	keywords: [
		'transportation',
		'blue-square',
		'mrt',
		'underground',
		'tube',
	],
	char: '🚇',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const tram = {
	keywords: [
		'transportation',
		'vehicle',
	],
	char: '🚊',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const station = {
	keywords: [
		'transportation',
		'vehicle',
		'public',
	],
	char: '🚉',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const flying_saucer = {
	keywords: [
		'transportation',
		'vehicle',
		'ufo',
	],
	char: '🛸',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const helicopter = {
	keywords: [
		'transportation',
		'vehicle',
		'fly',
	],
	char: '🚁',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const small_airplane = {
	keywords: [
		'flight',
		'transportation',
		'fly',
		'vehicle',
	],
	char: '🛩',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const airplane = {
	keywords: [
		'vehicle',
		'transportation',
		'flight',
		'fly',
	],
	char: '✈️',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const flight_departure = {
	keywords: [
		'airport',
		'flight',
		'landing',
	],
	char: '🛫',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const flight_arrival = {
	keywords: [
		'airport',
		'flight',
		'boarding',
	],
	char: '🛬',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const sailboat = {
	keywords: [
		'ship',
		'summer',
		'transportation',
		'water',
		'sailing',
	],
	char: '⛵',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const motor_boat = {
	keywords: [
		'ship',
	],
	char: '🛥',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const speedboat = {
	keywords: [
		'ship',
		'transportation',
		'vehicle',
		'summer',
	],
	char: '🚤',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const ferry = {
	keywords: [
		'boat',
		'ship',
		'yacht',
	],
	char: '⛴',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const passenger_ship = {
	keywords: [
		'yacht',
		'cruise',
		'ferry',
	],
	char: '🛳',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const rocket = {
	keywords: [
		'launch',
		'ship',
		'staffmode',
		'NASA',
		'outer space',
		'outer_space',
		'fly',
	],
	char: '🚀',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const artificial_satellite = {
	keywords: [
		'communication',
		'gps',
		'orbit',
		'spaceflight',
		'NASA',
		'ISS',
	],
	char: '🛰',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const seat = {
	keywords: [
		'sit',
		'airplane',
		'transport',
		'bus',
		'flight',
		'fly',
	],
	char: '💺',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const canoe = {
	keywords: [
		'boat',
		'paddle',
		'water',
		'ship',
	],
	char: '🛶',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const anchor = {
	keywords: [
		'ship',
		'ferry',
		'sea',
		'boat',
	],
	char: '⚓',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const construction = {
	keywords: [
		'wip',
		'progress',
		'caution',
		'warning',
	],
	char: '🚧',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const fuelpump = {
	keywords: [
		'gas station',
		'petroleum',
	],
	char: '⛽',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const busstop = {
	keywords: [
		'transportation',
		'wait',
	],
	char: '🚏',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const vertical_traffic_light = {
	keywords: [
		'transportation',
		'driving',
	],
	char: '🚦',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const traffic_light = {
	keywords: [
		'transportation',
		'signal',
	],
	char: '🚥',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const checkered_flag = {
	keywords: [
		'contest',
		'finishline',
		'race',
		'gokart',
	],
	char: '🏁',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const ship = {
	keywords: [
		'transportation',
		'titanic',
		'deploy',
	],
	char: '🚢',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const ferris_wheel = {
	keywords: [
		'photo',
		'carnival',
		'londoneye',
	],
	char: '🎡',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const roller_coaster = {
	keywords: [
		'carnival',
		'playground',
		'photo',
		'fun',
	],
	char: '🎢',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const carousel_horse = {
	keywords: [
		'photo',
		'carnival',
	],
	char: '🎠',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const building_construction = {
	keywords: [
		'wip',
		'working',
		'progress',
	],
	char: '🏗',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const foggy = {
	keywords: [
		'photo',
		'mountain',
	],
	char: '🌁',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const tokyo_tower = {
	keywords: [
		'photo',
		'japanese',
	],
	char: '🗼',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const factory = {
	keywords: [
		'building',
		'industry',
		'pollution',
		'smoke',
	],
	char: '🏭',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const fountain = {
	keywords: [
		'photo',
		'summer',
		'water',
		'fresh',
	],
	char: '⛲',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const rice_scene = {
	keywords: [
		'photo',
		'japan',
		'asia',
		'tsukimi',
	],
	char: '🎑',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const mountain = {
	keywords: [
		'photo',
		'nature',
		'environment',
	],
	char: '⛰',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const mountain_snow = {
	keywords: [
		'photo',
		'nature',
		'environment',
		'winter',
		'cold',
	],
	char: '🏔',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const mount_fuji = {
	keywords: [
		'photo',
		'mountain',
		'nature',
		'japanese',
	],
	char: '🗻',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const volcano = {
	keywords: [
		'photo',
		'nature',
		'disaster',
	],
	char: '🌋',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const japan = {
	keywords: [
		'nation',
		'country',
		'japanese',
		'asia',
	],
	char: '🗾',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const camping = {
	keywords: [
		'photo',
		'outdoors',
		'tent',
	],
	char: '🏕',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const tent = {
	keywords: [
		'photo',
		'camping',
		'outdoors',
	],
	char: '⛺',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const national_park = {
	keywords: [
		'photo',
		'environment',
		'nature',
	],
	char: '🏞',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const motorway = {
	keywords: [
		'road',
		'cupertino',
		'interstate',
		'highway',
	],
	char: '🛣',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const railway_track = {
	keywords: [
		'train',
		'transportation',
	],
	char: '🛤',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const sunrise = {
	keywords: [
		'morning',
		'view',
		'vacation',
		'photo',
	],
	char: '🌅',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const sunrise_over_mountains = {
	keywords: [
		'view',
		'vacation',
		'photo',
	],
	char: '🌄',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const desert = {
	keywords: [
		'photo',
		'warm',
		'saharah',
	],
	char: '🏜',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const beach_umbrella = {
	keywords: [
		'weather',
		'summer',
		'sunny',
		'sand',
		'mojito',
	],
	char: '🏖',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const desert_island = {
	keywords: [
		'photo',
		'tropical',
		'mojito',
	],
	char: '🏝',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const city_sunrise = {
	keywords: [
		'photo',
		'good morning',
		'dawn',
	],
	char: '🌇',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const city_sunset = {
	keywords: [
		'photo',
		'evening',
		'sky',
		'buildings',
	],
	char: '🌆',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const cityscape = {
	keywords: [
		'photo',
		'night life',
		'urban',
	],
	char: '🏙',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const night_with_stars = {
	keywords: [
		'evening',
		'city',
		'downtown',
	],
	char: '🌃',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const bridge_at_night = {
	keywords: [
		'photo',
		'sanfrancisco',
	],
	char: '🌉',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const milky_way = {
	keywords: [
		'photo',
		'space',
		'stars',
	],
	char: '🌌',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const stars = {
	keywords: [
		'night',
		'photo',
	],
	char: '🌠',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const sparkler = {
	keywords: [
		'stars',
		'night',
		'shine',
	],
	char: '🎇',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const fireworks = {
	keywords: [
		'photo',
		'festival',
		'carnival',
		'congratulations',
	],
	char: '🎆',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const rainbow = {
	keywords: [
		'nature',
		'happy',
		'unicorn_face',
		'photo',
		'sky',
		'spring',
	],
	char: '🌈',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const houses = {
	keywords: [
		'buildings',
		'photo',
	],
	char: '🏘',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const european_castle = {
	keywords: [
		'building',
		'royalty',
		'history',
	],
	char: '🏰',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const japanese_castle = {
	keywords: [
		'photo',
		'building',
	],
	char: '🏯',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const stadium = {
	keywords: [
		'photo',
		'place',
		'sports',
		'concert',
		'venue',
	],
	char: '🏟',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const statue_of_liberty = {
	keywords: [
		'american',
		'newyork',
	],
	char: '🗽',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const house = {
	keywords: [
		'building',
		'home',
	],
	char: '🏠',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const house_with_garden = {
	keywords: [
		'home',
		'plant',
		'nature',
	],
	char: '🏡',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const derelict_house = {
	keywords: [
		'abandon',
		'evict',
		'broken',
		'building',
	],
	char: '🏚',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const office = {
	keywords: [
		'building',
		'bureau',
		'work',
	],
	char: '🏢',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const department_store = {
	keywords: [
		'building',
		'shopping',
		'mall',
	],
	char: '🏬',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const post_office = {
	keywords: [
		'building',
		'envelope',
		'communication',
	],
	char: '🏣',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const european_post_office = {
	keywords: [
		'building',
		'email',
	],
	char: '🏤',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const hospital = {
	keywords: [
		'building',
		'health',
		'surgery',
		'doctor',
	],
	char: '🏥',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const bank = {
	keywords: [
		'building',
		'money',
		'sales',
		'cash',
		'business',
		'enterprise',
	],
	char: '🏦',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const hotel = {
	keywords: [
		'building',
		'accomodation',
		'checkin',
	],
	char: '🏨',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const convenience_store = {
	keywords: [
		'building',
		'shopping',
		'groceries',
	],
	char: '🏪',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const school = {
	keywords: [
		'building',
		'student',
		'education',
		'learn',
		'teach',
	],
	char: '🏫',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const love_hotel = {
	keywords: [
		'like',
		'affection',
		'dating',
	],
	char: '🏩',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const wedding = {
	keywords: [
		'love',
		'like',
		'affection',
		'couple',
		'marriage',
		'bride',
		'groom',
	],
	char: '💒',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const classical_building = {
	keywords: [
		'art',
		'culture',
		'history',
	],
	char: '🏛',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const church = {
	keywords: [
		'building',
		'religion',
		'christ',
	],
	char: '⛪',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const mosque = {
	keywords: [
		'islam',
		'worship',
		'minaret',
	],
	char: '🕌',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const synagogue = {
	keywords: [
		'judaism',
		'worship',
		'temple',
		'jewish',
	],
	char: '🕍',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const kaaba = {
	keywords: [
		'mecca',
		'mosque',
		'islam',
	],
	char: '🕋',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const shinto_shrine = {
	keywords: [
		'temple',
		'japan',
		'kyoto',
	],
	char: '⛩',
	fitzpatrick_scale: false,
	category: 'travel_and_places',
};
const watch = {
	keywords: [
		'time',
		'accessories',
	],
	char: '⌚',
	fitzpatrick_scale: false,
	category: 'objects',
};
const iphone = {
	keywords: [
		'technology',
		'apple',
		'gadgets',
		'dial',
	],
	char: '📱',
	fitzpatrick_scale: false,
	category: 'objects',
};
const calling = {
	keywords: [
		'iphone',
		'incoming',
	],
	char: '📲',
	fitzpatrick_scale: false,
	category: 'objects',
};
const computer = {
	keywords: [
		'technology',
		'laptop',
		'screen',
		'display',
		'monitor',
	],
	char: '💻',
	fitzpatrick_scale: false,
	category: 'objects',
};
const keyboard = {
	keywords: [
		'technology',
		'computer',
		'type',
		'input',
		'text',
	],
	char: '⌨',
	fitzpatrick_scale: false,
	category: 'objects',
};
const desktop_computer = {
	keywords: [
		'technology',
		'computing',
		'screen',
	],
	char: '🖥',
	fitzpatrick_scale: false,
	category: 'objects',
};
const printer = {
	keywords: [
		'paper',
		'ink',
	],
	char: '🖨',
	fitzpatrick_scale: false,
	category: 'objects',
};
const computer_mouse = {
	keywords: [
		'click',
	],
	char: '🖱',
	fitzpatrick_scale: false,
	category: 'objects',
};
const trackball = {
	keywords: [
		'technology',
		'trackpad',
	],
	char: '🖲',
	fitzpatrick_scale: false,
	category: 'objects',
};
const joystick = {
	keywords: [
		'game',
		'play',
	],
	char: '🕹',
	fitzpatrick_scale: false,
	category: 'objects',
};
const clamp = {
	keywords: [
		'tool',
	],
	char: '🗜',
	fitzpatrick_scale: false,
	category: 'objects',
};
const minidisc = {
	keywords: [
		'technology',
		'record',
		'data',
		'disk',
		'90s',
	],
	char: '💽',
	fitzpatrick_scale: false,
	category: 'objects',
};
const floppy_disk = {
	keywords: [
		'oldschool',
		'technology',
		'save',
		'90s',
		'80s',
	],
	char: '💾',
	fitzpatrick_scale: false,
	category: 'objects',
};
const cd = {
	keywords: [
		'technology',
		'dvd',
		'disk',
		'disc',
		'90s',
	],
	char: '💿',
	fitzpatrick_scale: false,
	category: 'objects',
};
const dvd = {
	keywords: [
		'cd',
		'disk',
		'disc',
	],
	char: '📀',
	fitzpatrick_scale: false,
	category: 'objects',
};
const vhs = {
	keywords: [
		'record',
		'video',
		'oldschool',
		'90s',
		'80s',
	],
	char: '📼',
	fitzpatrick_scale: false,
	category: 'objects',
};
const camera = {
	keywords: [
		'gadgets',
		'photography',
	],
	char: '📷',
	fitzpatrick_scale: false,
	category: 'objects',
};
const camera_flash = {
	keywords: [
		'photography',
		'gadgets',
	],
	char: '📸',
	fitzpatrick_scale: false,
	category: 'objects',
};
const video_camera = {
	keywords: [
		'film',
		'record',
	],
	char: '📹',
	fitzpatrick_scale: false,
	category: 'objects',
};
const movie_camera = {
	keywords: [
		'film',
		'record',
	],
	char: '🎥',
	fitzpatrick_scale: false,
	category: 'objects',
};
const film_projector = {
	keywords: [
		'video',
		'tape',
		'record',
		'movie',
	],
	char: '📽',
	fitzpatrick_scale: false,
	category: 'objects',
};
const film_strip = {
	keywords: [
		'movie',
	],
	char: '🎞',
	fitzpatrick_scale: false,
	category: 'objects',
};
const telephone_receiver = {
	keywords: [
		'technology',
		'communication',
		'dial',
	],
	char: '📞',
	fitzpatrick_scale: false,
	category: 'objects',
};
const phone = {
	keywords: [
		'technology',
		'communication',
		'dial',
		'telephone',
	],
	char: '☎️',
	fitzpatrick_scale: false,
	category: 'objects',
};
const pager = {
	keywords: [
		'bbcall',
		'oldschool',
		'90s',
	],
	char: '📟',
	fitzpatrick_scale: false,
	category: 'objects',
};
const fax = {
	keywords: [
		'communication',
		'technology',
	],
	char: '📠',
	fitzpatrick_scale: false,
	category: 'objects',
};
const tv = {
	keywords: [
		'technology',
		'program',
		'oldschool',
		'show',
		'television',
	],
	char: '📺',
	fitzpatrick_scale: false,
	category: 'objects',
};
const radio = {
	keywords: [
		'communication',
		'music',
		'podcast',
		'program',
	],
	char: '📻',
	fitzpatrick_scale: false,
	category: 'objects',
};
const studio_microphone = {
	keywords: [
		'sing',
		'recording',
		'artist',
		'talkshow',
	],
	char: '🎙',
	fitzpatrick_scale: false,
	category: 'objects',
};
const level_slider = {
	keywords: [
		'scale',
	],
	char: '🎚',
	fitzpatrick_scale: false,
	category: 'objects',
};
const control_knobs = {
	keywords: [
		'dial',
	],
	char: '🎛',
	fitzpatrick_scale: false,
	category: 'objects',
};
const compass = {
	keywords: [
		'magnetic',
		'navigation',
		'orienteering',
	],
	char: '🧭',
	fitzpatrick_scale: false,
	category: 'objects',
};
const stopwatch = {
	keywords: [
		'time',
		'deadline',
	],
	char: '⏱',
	fitzpatrick_scale: false,
	category: 'objects',
};
const timer_clock = {
	keywords: [
		'alarm',
	],
	char: '⏲',
	fitzpatrick_scale: false,
	category: 'objects',
};
const alarm_clock = {
	keywords: [
		'time',
		'wake',
	],
	char: '⏰',
	fitzpatrick_scale: false,
	category: 'objects',
};
const mantelpiece_clock = {
	keywords: [
		'time',
	],
	char: '🕰',
	fitzpatrick_scale: false,
	category: 'objects',
};
const hourglass_flowing_sand = {
	keywords: [
		'oldschool',
		'time',
		'countdown',
	],
	char: '⏳',
	fitzpatrick_scale: false,
	category: 'objects',
};
const hourglass = {
	keywords: [
		'time',
		'clock',
		'oldschool',
		'limit',
		'exam',
		'quiz',
		'test',
	],
	char: '⌛',
	fitzpatrick_scale: false,
	category: 'objects',
};
const satellite = {
	keywords: [
		'communication',
		'future',
		'radio',
		'space',
	],
	char: '📡',
	fitzpatrick_scale: false,
	category: 'objects',
};
const battery = {
	keywords: [
		'power',
		'energy',
		'sustain',
	],
	char: '🔋',
	fitzpatrick_scale: false,
	category: 'objects',
};
const electric_plug = {
	keywords: [
		'charger',
		'power',
	],
	char: '🔌',
	fitzpatrick_scale: false,
	category: 'objects',
};
const bulb = {
	keywords: [
		'light',
		'electricity',
		'idea',
	],
	char: '💡',
	fitzpatrick_scale: false,
	category: 'objects',
};
const flashlight = {
	keywords: [
		'dark',
		'camping',
		'sight',
		'night',
	],
	char: '🔦',
	fitzpatrick_scale: false,
	category: 'objects',
};
const candle = {
	keywords: [
		'fire',
		'wax',
	],
	char: '🕯',
	fitzpatrick_scale: false,
	category: 'objects',
};
const fire_extinguisher = {
	keywords: [
		'quench',
	],
	char: '🧯',
	fitzpatrick_scale: false,
	category: 'objects',
};
const wastebasket = {
	keywords: [
		'bin',
		'trash',
		'rubbish',
		'garbage',
		'toss',
	],
	char: '🗑',
	fitzpatrick_scale: false,
	category: 'objects',
};
const oil_drum = {
	keywords: [
		'barrell',
	],
	char: '🛢',
	fitzpatrick_scale: false,
	category: 'objects',
};
const money_with_wings = {
	keywords: [
		'dollar',
		'bills',
		'payment',
		'sale',
	],
	char: '💸',
	fitzpatrick_scale: false,
	category: 'objects',
};
const dollar = {
	keywords: [
		'money',
		'sales',
		'bill',
		'currency',
	],
	char: '💵',
	fitzpatrick_scale: false,
	category: 'objects',
};
const yen = {
	keywords: [
		'money',
		'sales',
		'japanese',
		'dollar',
		'currency',
	],
	char: '💴',
	fitzpatrick_scale: false,
	category: 'objects',
};
const euro = {
	keywords: [
		'money',
		'sales',
		'dollar',
		'currency',
	],
	char: '💶',
	fitzpatrick_scale: false,
	category: 'objects',
};
const pound = {
	keywords: [
		'british',
		'sterling',
		'money',
		'sales',
		'bills',
		'uk',
		'england',
		'currency',
	],
	char: '💷',
	fitzpatrick_scale: false,
	category: 'objects',
};
const moneybag = {
	keywords: [
		'dollar',
		'payment',
		'coins',
		'sale',
	],
	char: '💰',
	fitzpatrick_scale: false,
	category: 'objects',
};
const credit_card = {
	keywords: [
		'money',
		'sales',
		'dollar',
		'bill',
		'payment',
		'shopping',
	],
	char: '💳',
	fitzpatrick_scale: false,
	category: 'objects',
};
const gem = {
	keywords: [
		'blue',
		'ruby',
		'diamond',
		'jewelry',
	],
	char: '💎',
	fitzpatrick_scale: false,
	category: 'objects',
};
const balance_scale = {
	keywords: [
		'law',
		'fairness',
		'weight',
	],
	char: '⚖',
	fitzpatrick_scale: false,
	category: 'objects',
};
const toolbox = {
	keywords: [
		'tools',
		'diy',
		'fix',
		'maintainer',
		'mechanic',
	],
	char: '🧰',
	fitzpatrick_scale: false,
	category: 'objects',
};
const wrench = {
	keywords: [
		'tools',
		'diy',
		'ikea',
		'fix',
		'maintainer',
	],
	char: '🔧',
	fitzpatrick_scale: false,
	category: 'objects',
};
const hammer = {
	keywords: [
		'tools',
		'build',
		'create',
	],
	char: '🔨',
	fitzpatrick_scale: false,
	category: 'objects',
};
const hammer_and_pick = {
	keywords: [
		'tools',
		'build',
		'create',
	],
	char: '⚒',
	fitzpatrick_scale: false,
	category: 'objects',
};
const hammer_and_wrench = {
	keywords: [
		'tools',
		'build',
		'create',
	],
	char: '🛠',
	fitzpatrick_scale: false,
	category: 'objects',
};
const pick = {
	keywords: [
		'tools',
		'dig',
	],
	char: '⛏',
	fitzpatrick_scale: false,
	category: 'objects',
};
const nut_and_bolt = {
	keywords: [
		'handy',
		'tools',
		'fix',
	],
	char: '🔩',
	fitzpatrick_scale: false,
	category: 'objects',
};
const gear = {
	keywords: [
		'cog',
	],
	char: '⚙',
	fitzpatrick_scale: false,
	category: 'objects',
};
const brick = {
	keywords: [
		'bricks',
	],
	char: '🧱',
	fitzpatrick_scale: false,
	category: 'objects',
};
const chains = {
	keywords: [
		'lock',
		'arrest',
	],
	char: '⛓',
	fitzpatrick_scale: false,
	category: 'objects',
};
const magnet = {
	keywords: [
		'attraction',
		'magnetic',
	],
	char: '🧲',
	fitzpatrick_scale: false,
	category: 'objects',
};
const gun = {
	keywords: [
		'violence',
		'weapon',
		'pistol',
		'revolver',
	],
	char: '🔫',
	fitzpatrick_scale: false,
	category: 'objects',
};
const bomb = {
	keywords: [
		'boom',
		'explode',
		'explosion',
		'terrorism',
	],
	char: '💣',
	fitzpatrick_scale: false,
	category: 'objects',
};
const firecracker = {
	keywords: [
		'dynamite',
		'boom',
		'explode',
		'explosion',
		'explosive',
	],
	char: '🧨',
	fitzpatrick_scale: false,
	category: 'objects',
};
const hocho = {
	keywords: [
		'knife',
		'blade',
		'cutlery',
		'kitchen',
		'weapon',
	],
	char: '🔪',
	fitzpatrick_scale: false,
	category: 'objects',
};
const dagger = {
	keywords: [
		'weapon',
	],
	char: '🗡',
	fitzpatrick_scale: false,
	category: 'objects',
};
const crossed_swords = {
	keywords: [
		'weapon',
	],
	char: '⚔',
	fitzpatrick_scale: false,
	category: 'objects',
};
const shield = {
	keywords: [
		'protection',
		'security',
	],
	char: '🛡',
	fitzpatrick_scale: false,
	category: 'objects',
};
const smoking = {
	keywords: [
		'kills',
		'tobacco',
		'cigarette',
		'joint',
		'smoke',
	],
	char: '🚬',
	fitzpatrick_scale: false,
	category: 'objects',
};
const skull_and_crossbones = {
	keywords: [
		'poison',
		'danger',
		'deadly',
		'scary',
		'death',
		'pirate',
		'evil',
	],
	char: '☠',
	fitzpatrick_scale: false,
	category: 'objects',
};
const coffin = {
	keywords: [
		'vampire',
		'dead',
		'die',
		'death',
		'rip',
		'graveyard',
		'cemetery',
		'casket',
		'funeral',
		'box',
	],
	char: '⚰',
	fitzpatrick_scale: false,
	category: 'objects',
};
const funeral_urn = {
	keywords: [
		'dead',
		'die',
		'death',
		'rip',
		'ashes',
	],
	char: '⚱',
	fitzpatrick_scale: false,
	category: 'objects',
};
const amphora = {
	keywords: [
		'vase',
		'jar',
	],
	char: '🏺',
	fitzpatrick_scale: false,
	category: 'objects',
};
const crystal_ball = {
	keywords: [
		'disco',
		'party',
		'magic',
		'circus',
		'fortune_teller',
	],
	char: '🔮',
	fitzpatrick_scale: false,
	category: 'objects',
};
const prayer_beads = {
	keywords: [
		'dhikr',
		'religious',
	],
	char: '📿',
	fitzpatrick_scale: false,
	category: 'objects',
};
const nazar_amulet = {
	keywords: [
		'bead',
		'charm',
	],
	char: '🧿',
	fitzpatrick_scale: false,
	category: 'objects',
};
const barber = {
	keywords: [
		'hair',
		'salon',
		'style',
	],
	char: '💈',
	fitzpatrick_scale: false,
	category: 'objects',
};
const alembic = {
	keywords: [
		'distilling',
		'science',
		'experiment',
		'chemistry',
	],
	char: '⚗',
	fitzpatrick_scale: false,
	category: 'objects',
};
const telescope = {
	keywords: [
		'stars',
		'space',
		'zoom',
		'science',
		'astronomy',
	],
	char: '🔭',
	fitzpatrick_scale: false,
	category: 'objects',
};
const microscope = {
	keywords: [
		'laboratory',
		'experiment',
		'zoomin',
		'science',
		'study',
	],
	char: '🔬',
	fitzpatrick_scale: false,
	category: 'objects',
};
const hole = {
	keywords: [
		'embarrassing',
	],
	char: '🕳',
	fitzpatrick_scale: false,
	category: 'objects',
};
const pill = {
	keywords: [
		'health',
		'medicine',
		'doctor',
		'pharmacy',
		'drug',
	],
	char: '💊',
	fitzpatrick_scale: false,
	category: 'objects',
};
const syringe = {
	keywords: [
		'health',
		'hospital',
		'drugs',
		'blood',
		'medicine',
		'needle',
		'doctor',
		'nurse',
	],
	char: '💉',
	fitzpatrick_scale: false,
	category: 'objects',
};
const dna = {
	keywords: [
		'biologist',
		'genetics',
		'life',
	],
	char: '🧬',
	fitzpatrick_scale: false,
	category: 'objects',
};
const microbe = {
	keywords: [
		'amoeba',
		'bacteria',
		'germs',
	],
	char: '🦠',
	fitzpatrick_scale: false,
	category: 'objects',
};
const petri_dish = {
	keywords: [
		'bacteria',
		'biology',
		'culture',
		'lab',
	],
	char: '🧫',
	fitzpatrick_scale: false,
	category: 'objects',
};
const test_tube = {
	keywords: [
		'chemistry',
		'experiment',
		'lab',
		'science',
	],
	char: '🧪',
	fitzpatrick_scale: false,
	category: 'objects',
};
const thermometer = {
	keywords: [
		'weather',
		'temperature',
		'hot',
		'cold',
	],
	char: '🌡',
	fitzpatrick_scale: false,
	category: 'objects',
};
const broom = {
	keywords: [
		'cleaning',
		'sweeping',
		'witch',
	],
	char: '🧹',
	fitzpatrick_scale: false,
	category: 'objects',
};
const basket = {
	keywords: [
		'laundry',
	],
	char: '🧺',
	fitzpatrick_scale: false,
	category: 'objects',
};
const toilet_paper = {
	keywords: [
		'roll',
	],
	char: '🧻',
	fitzpatrick_scale: false,
	category: 'objects',
};
const label = {
	keywords: [
		'sale',
		'tag',
	],
	char: '🏷',
	fitzpatrick_scale: false,
	category: 'objects',
};
const bookmark = {
	keywords: [
		'favorite',
		'label',
		'save',
	],
	char: '🔖',
	fitzpatrick_scale: false,
	category: 'objects',
};
const toilet = {
	keywords: [
		'restroom',
		'wc',
		'washroom',
		'bathroom',
		'potty',
	],
	char: '🚽',
	fitzpatrick_scale: false,
	category: 'objects',
};
const shower = {
	keywords: [
		'clean',
		'water',
		'bathroom',
	],
	char: '🚿',
	fitzpatrick_scale: false,
	category: 'objects',
};
const bathtub = {
	keywords: [
		'clean',
		'shower',
		'bathroom',
	],
	char: '🛁',
	fitzpatrick_scale: false,
	category: 'objects',
};
const soap = {
	keywords: [
		'bar',
		'bathing',
		'cleaning',
		'lather',
	],
	char: '🧼',
	fitzpatrick_scale: false,
	category: 'objects',
};
const sponge = {
	keywords: [
		'absorbing',
		'cleaning',
		'porous',
	],
	char: '🧽',
	fitzpatrick_scale: false,
	category: 'objects',
};
const lotion_bottle = {
	keywords: [
		'moisturizer',
		'sunscreen',
	],
	char: '🧴',
	fitzpatrick_scale: false,
	category: 'objects',
};
const key = {
	keywords: [
		'lock',
		'door',
		'password',
	],
	char: '🔑',
	fitzpatrick_scale: false,
	category: 'objects',
};
const old_key = {
	keywords: [
		'lock',
		'door',
		'password',
	],
	char: '🗝',
	fitzpatrick_scale: false,
	category: 'objects',
};
const couch_and_lamp = {
	keywords: [
		'read',
		'chill',
	],
	char: '🛋',
	fitzpatrick_scale: false,
	category: 'objects',
};
const sleeping_bed = {
	keywords: [
		'bed',
		'rest',
	],
	char: '🛌',
	fitzpatrick_scale: true,
	category: 'objects',
};
const bed = {
	keywords: [
		'sleep',
		'rest',
	],
	char: '🛏',
	fitzpatrick_scale: false,
	category: 'objects',
};
const door = {
	keywords: [
		'house',
		'entry',
		'exit',
	],
	char: '🚪',
	fitzpatrick_scale: false,
	category: 'objects',
};
const bellhop_bell = {
	keywords: [
		'service',
	],
	char: '🛎',
	fitzpatrick_scale: false,
	category: 'objects',
};
const teddy_bear = {
	keywords: [
		'plush',
		'stuffed',
	],
	char: '🧸',
	fitzpatrick_scale: false,
	category: 'objects',
};
const framed_picture = {
	keywords: [
		'photography',
	],
	char: '🖼',
	fitzpatrick_scale: false,
	category: 'objects',
};
const world_map = {
	keywords: [
		'location',
		'direction',
	],
	char: '🗺',
	fitzpatrick_scale: false,
	category: 'objects',
};
const parasol_on_ground = {
	keywords: [
		'weather',
		'summer',
	],
	char: '⛱',
	fitzpatrick_scale: false,
	category: 'objects',
};
const moyai = {
	keywords: [
		'rock',
		'easter island',
		'moai',
	],
	char: '🗿',
	fitzpatrick_scale: false,
	category: 'objects',
};
const shopping = {
	keywords: [
		'mall',
		'buy',
		'purchase',
	],
	char: '🛍',
	fitzpatrick_scale: false,
	category: 'objects',
};
const shopping_cart = {
	keywords: [
		'trolley',
	],
	char: '🛒',
	fitzpatrick_scale: false,
	category: 'objects',
};
const balloon = {
	keywords: [
		'party',
		'celebration',
		'birthday',
		'circus',
	],
	char: '🎈',
	fitzpatrick_scale: false,
	category: 'objects',
};
const flags = {
	keywords: [
		'fish',
		'japanese',
		'koinobori',
		'carp',
		'banner',
	],
	char: '🎏',
	fitzpatrick_scale: false,
	category: 'objects',
};
const ribbon = {
	keywords: [
		'decoration',
		'pink',
		'girl',
		'bowtie',
	],
	char: '🎀',
	fitzpatrick_scale: false,
	category: 'objects',
};
const gift = {
	keywords: [
		'present',
		'birthday',
		'christmas',
		'xmas',
	],
	char: '🎁',
	fitzpatrick_scale: false,
	category: 'objects',
};
const confetti_ball = {
	keywords: [
		'festival',
		'party',
		'birthday',
		'circus',
	],
	char: '🎊',
	fitzpatrick_scale: false,
	category: 'objects',
};
const tada = {
	keywords: [
		'party',
		'congratulations',
		'birthday',
		'magic',
		'circus',
		'celebration',
	],
	char: '🎉',
	fitzpatrick_scale: false,
	category: 'objects',
};
const dolls = {
	keywords: [
		'japanese',
		'toy',
		'kimono',
	],
	char: '🎎',
	fitzpatrick_scale: false,
	category: 'objects',
};
const wind_chime = {
	keywords: [
		'nature',
		'ding',
		'spring',
		'bell',
	],
	char: '🎐',
	fitzpatrick_scale: false,
	category: 'objects',
};
const crossed_flags = {
	keywords: [
		'japanese',
		'nation',
		'country',
		'border',
	],
	char: '🎌',
	fitzpatrick_scale: false,
	category: 'objects',
};
const izakaya_lantern = {
	keywords: [
		'light',
		'paper',
		'halloween',
		'spooky',
	],
	char: '🏮',
	fitzpatrick_scale: false,
	category: 'objects',
};
const red_envelope = {
	keywords: [
		'gift',
	],
	char: '🧧',
	fitzpatrick_scale: false,
	category: 'objects',
};
const email = {
	keywords: [
		'letter',
		'postal',
		'inbox',
		'communication',
	],
	char: '✉️',
	fitzpatrick_scale: false,
	category: 'objects',
};
const envelope_with_arrow = {
	keywords: [
		'email',
		'communication',
	],
	char: '📩',
	fitzpatrick_scale: false,
	category: 'objects',
};
const incoming_envelope = {
	keywords: [
		'email',
		'inbox',
	],
	char: '📨',
	fitzpatrick_scale: false,
	category: 'objects',
};
const love_letter = {
	keywords: [
		'email',
		'like',
		'affection',
		'envelope',
		'valentines',
	],
	char: '💌',
	fitzpatrick_scale: false,
	category: 'objects',
};
const postbox = {
	keywords: [
		'email',
		'letter',
		'envelope',
	],
	char: '📮',
	fitzpatrick_scale: false,
	category: 'objects',
};
const mailbox_closed = {
	keywords: [
		'email',
		'communication',
		'inbox',
	],
	char: '📪',
	fitzpatrick_scale: false,
	category: 'objects',
};
const mailbox = {
	keywords: [
		'email',
		'inbox',
		'communication',
	],
	char: '📫',
	fitzpatrick_scale: false,
	category: 'objects',
};
const mailbox_with_mail = {
	keywords: [
		'email',
		'inbox',
		'communication',
	],
	char: '📬',
	fitzpatrick_scale: false,
	category: 'objects',
};
const mailbox_with_no_mail = {
	keywords: [
		'email',
		'inbox',
	],
	char: '📭',
	fitzpatrick_scale: false,
	category: 'objects',
};
const postal_horn = {
	keywords: [
		'instrument',
		'music',
	],
	char: '📯',
	fitzpatrick_scale: false,
	category: 'objects',
};
const inbox_tray = {
	keywords: [
		'email',
		'documents',
	],
	char: '📥',
	fitzpatrick_scale: false,
	category: 'objects',
};
const outbox_tray = {
	keywords: [
		'inbox',
		'email',
	],
	char: '📤',
	fitzpatrick_scale: false,
	category: 'objects',
};
const scroll = {
	keywords: [
		'documents',
		'ancient',
		'history',
		'paper',
	],
	char: '📜',
	fitzpatrick_scale: false,
	category: 'objects',
};
const page_with_curl = {
	keywords: [
		'documents',
		'office',
		'paper',
	],
	char: '📃',
	fitzpatrick_scale: false,
	category: 'objects',
};
const bookmark_tabs = {
	keywords: [
		'favorite',
		'save',
		'order',
		'tidy',
	],
	char: '📑',
	fitzpatrick_scale: false,
	category: 'objects',
};
const receipt = {
	keywords: [
		'accounting',
		'expenses',
	],
	char: '🧾',
	fitzpatrick_scale: false,
	category: 'objects',
};
const bar_chart = {
	keywords: [
		'graph',
		'presentation',
		'stats',
	],
	char: '📊',
	fitzpatrick_scale: false,
	category: 'objects',
};
const chart_with_upwards_trend = {
	keywords: [
		'graph',
		'presentation',
		'stats',
		'recovery',
		'business',
		'economics',
		'money',
		'sales',
		'good',
		'success',
	],
	char: '📈',
	fitzpatrick_scale: false,
	category: 'objects',
};
const chart_with_downwards_trend = {
	keywords: [
		'graph',
		'presentation',
		'stats',
		'recession',
		'business',
		'economics',
		'money',
		'sales',
		'bad',
		'failure',
	],
	char: '📉',
	fitzpatrick_scale: false,
	category: 'objects',
};
const page_facing_up = {
	keywords: [
		'documents',
		'office',
		'paper',
		'information',
	],
	char: '📄',
	fitzpatrick_scale: false,
	category: 'objects',
};
const date = {
	keywords: [
		'calendar',
		'schedule',
	],
	char: '📅',
	fitzpatrick_scale: false,
	category: 'objects',
};
const calendar = {
	keywords: [
		'schedule',
		'date',
		'planning',
	],
	char: '📆',
	fitzpatrick_scale: false,
	category: 'objects',
};
const spiral_calendar = {
	keywords: [
		'date',
		'schedule',
		'planning',
	],
	char: '🗓',
	fitzpatrick_scale: false,
	category: 'objects',
};
const card_index = {
	keywords: [
		'business',
		'stationery',
	],
	char: '📇',
	fitzpatrick_scale: false,
	category: 'objects',
};
const card_file_box = {
	keywords: [
		'business',
		'stationery',
	],
	char: '🗃',
	fitzpatrick_scale: false,
	category: 'objects',
};
const ballot_box = {
	keywords: [
		'election',
		'vote',
	],
	char: '🗳',
	fitzpatrick_scale: false,
	category: 'objects',
};
const file_cabinet = {
	keywords: [
		'filing',
		'organizing',
	],
	char: '🗄',
	fitzpatrick_scale: false,
	category: 'objects',
};
const clipboard = {
	keywords: [
		'stationery',
		'documents',
	],
	char: '📋',
	fitzpatrick_scale: false,
	category: 'objects',
};
const spiral_notepad = {
	keywords: [
		'memo',
		'stationery',
	],
	char: '🗒',
	fitzpatrick_scale: false,
	category: 'objects',
};
const file_folder = {
	keywords: [
		'documents',
		'business',
		'office',
	],
	char: '📁',
	fitzpatrick_scale: false,
	category: 'objects',
};
const open_file_folder = {
	keywords: [
		'documents',
		'load',
	],
	char: '📂',
	fitzpatrick_scale: false,
	category: 'objects',
};
const card_index_dividers = {
	keywords: [
		'organizing',
		'business',
		'stationery',
	],
	char: '🗂',
	fitzpatrick_scale: false,
	category: 'objects',
};
const newspaper_roll = {
	keywords: [
		'press',
		'headline',
	],
	char: '🗞',
	fitzpatrick_scale: false,
	category: 'objects',
};
const newspaper = {
	keywords: [
		'press',
		'headline',
	],
	char: '📰',
	fitzpatrick_scale: false,
	category: 'objects',
};
const notebook = {
	keywords: [
		'stationery',
		'record',
		'notes',
		'paper',
		'study',
	],
	char: '📓',
	fitzpatrick_scale: false,
	category: 'objects',
};
const closed_book = {
	keywords: [
		'read',
		'library',
		'knowledge',
		'textbook',
		'learn',
	],
	char: '📕',
	fitzpatrick_scale: false,
	category: 'objects',
};
const green_book = {
	keywords: [
		'read',
		'library',
		'knowledge',
		'study',
	],
	char: '📗',
	fitzpatrick_scale: false,
	category: 'objects',
};
const blue_book = {
	keywords: [
		'read',
		'library',
		'knowledge',
		'learn',
		'study',
	],
	char: '📘',
	fitzpatrick_scale: false,
	category: 'objects',
};
const orange_book = {
	keywords: [
		'read',
		'library',
		'knowledge',
		'textbook',
		'study',
	],
	char: '📙',
	fitzpatrick_scale: false,
	category: 'objects',
};
const notebook_with_decorative_cover = {
	keywords: [
		'classroom',
		'notes',
		'record',
		'paper',
		'study',
	],
	char: '📔',
	fitzpatrick_scale: false,
	category: 'objects',
};
const ledger = {
	keywords: [
		'notes',
		'paper',
	],
	char: '📒',
	fitzpatrick_scale: false,
	category: 'objects',
};
const books = {
	keywords: [
		'literature',
		'library',
		'study',
	],
	char: '📚',
	fitzpatrick_scale: false,
	category: 'objects',
};
const open_book = {
	keywords: [
		'book',
		'read',
		'library',
		'knowledge',
		'literature',
		'learn',
		'study',
	],
	char: '📖',
	fitzpatrick_scale: false,
	category: 'objects',
};
const safety_pin = {
	keywords: [
		'diaper',
	],
	char: '🧷',
	fitzpatrick_scale: false,
	category: 'objects',
};
const link = {
	keywords: [
		'rings',
		'url',
	],
	char: '🔗',
	fitzpatrick_scale: false,
	category: 'objects',
};
const paperclip = {
	keywords: [
		'documents',
		'stationery',
	],
	char: '📎',
	fitzpatrick_scale: false,
	category: 'objects',
};
const paperclips = {
	keywords: [
		'documents',
		'stationery',
	],
	char: '🖇',
	fitzpatrick_scale: false,
	category: 'objects',
};
const scissors = {
	keywords: [
		'stationery',
		'cut',
	],
	char: '✂️',
	fitzpatrick_scale: false,
	category: 'objects',
};
const triangular_ruler = {
	keywords: [
		'stationery',
		'math',
		'architect',
		'sketch',
	],
	char: '📐',
	fitzpatrick_scale: false,
	category: 'objects',
};
const straight_ruler = {
	keywords: [
		'stationery',
		'calculate',
		'length',
		'math',
		'school',
		'drawing',
		'architect',
		'sketch',
	],
	char: '📏',
	fitzpatrick_scale: false,
	category: 'objects',
};
const abacus = {
	keywords: [
		'calculation',
	],
	char: '🧮',
	fitzpatrick_scale: false,
	category: 'objects',
};
const pushpin = {
	keywords: [
		'stationery',
		'mark',
		'here',
	],
	char: '📌',
	fitzpatrick_scale: false,
	category: 'objects',
};
const round_pushpin = {
	keywords: [
		'stationery',
		'location',
		'map',
		'here',
	],
	char: '📍',
	fitzpatrick_scale: false,
	category: 'objects',
};
const triangular_flag_on_post = {
	keywords: [
		'mark',
		'milestone',
		'place',
	],
	char: '🚩',
	fitzpatrick_scale: false,
	category: 'objects',
};
const white_flag = {
	keywords: [
		'losing',
		'loser',
		'lost',
		'surrender',
		'give up',
		'fail',
	],
	char: '🏳',
	fitzpatrick_scale: false,
	category: 'objects',
};
const black_flag = {
	keywords: [
		'pirate',
	],
	char: '🏴',
	fitzpatrick_scale: false,
	category: 'objects',
};
const rainbow_flag = {
	keywords: [
		'flag',
		'rainbow',
		'pride',
		'gay',
		'lgbt',
		'glbt',
		'queer',
		'homosexual',
		'lesbian',
		'bisexual',
		'transgender',
	],
	char: '🏳️‍🌈',
	fitzpatrick_scale: false,
	category: 'objects',
};
const closed_lock_with_key = {
	keywords: [
		'security',
		'privacy',
	],
	char: '🔐',
	fitzpatrick_scale: false,
	category: 'objects',
};
const lock = {
	keywords: [
		'security',
		'password',
		'padlock',
	],
	char: '🔒',
	fitzpatrick_scale: false,
	category: 'objects',
};
const unlock = {
	keywords: [
		'privacy',
		'security',
	],
	char: '🔓',
	fitzpatrick_scale: false,
	category: 'objects',
};
const lock_with_ink_pen = {
	keywords: [
		'security',
		'secret',
	],
	char: '🔏',
	fitzpatrick_scale: false,
	category: 'objects',
};
const pen = {
	keywords: [
		'stationery',
		'writing',
		'write',
	],
	char: '🖊',
	fitzpatrick_scale: false,
	category: 'objects',
};
const fountain_pen = {
	keywords: [
		'stationery',
		'writing',
		'write',
	],
	char: '🖋',
	fitzpatrick_scale: false,
	category: 'objects',
};
const black_nib = {
	keywords: [
		'pen',
		'stationery',
		'writing',
		'write',
	],
	char: '✒️',
	fitzpatrick_scale: false,
	category: 'objects',
};
const memo = {
	keywords: [
		'write',
		'documents',
		'stationery',
		'pencil',
		'paper',
		'writing',
		'legal',
		'exam',
		'quiz',
		'test',
		'study',
		'compose',
	],
	char: '📝',
	fitzpatrick_scale: false,
	category: 'objects',
};
const pencil2 = {
	keywords: [
		'stationery',
		'write',
		'paper',
		'writing',
		'school',
		'study',
	],
	char: '✏️',
	fitzpatrick_scale: false,
	category: 'objects',
};
const crayon = {
	keywords: [
		'drawing',
		'creativity',
	],
	char: '🖍',
	fitzpatrick_scale: false,
	category: 'objects',
};
const paintbrush = {
	keywords: [
		'drawing',
		'creativity',
		'art',
	],
	char: '🖌',
	fitzpatrick_scale: false,
	category: 'objects',
};
const mag = {
	keywords: [
		'search',
		'zoom',
		'find',
		'detective',
	],
	char: '🔍',
	fitzpatrick_scale: false,
	category: 'objects',
};
const mag_right = {
	keywords: [
		'search',
		'zoom',
		'find',
		'detective',
	],
	char: '🔎',
	fitzpatrick_scale: false,
	category: 'objects',
};
const heart = {
	keywords: [
		'love',
		'like',
		'valentines',
	],
	char: '❤️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const orange_heart = {
	keywords: [
		'love',
		'like',
		'affection',
		'valentines',
	],
	char: '🧡',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const yellow_heart = {
	keywords: [
		'love',
		'like',
		'affection',
		'valentines',
	],
	char: '💛',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const green_heart = {
	keywords: [
		'love',
		'like',
		'affection',
		'valentines',
	],
	char: '💚',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const blue_heart = {
	keywords: [
		'love',
		'like',
		'affection',
		'valentines',
	],
	char: '💙',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const purple_heart = {
	keywords: [
		'love',
		'like',
		'affection',
		'valentines',
	],
	char: '💜',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const black_heart = {
	keywords: [
		'evil',
	],
	char: '🖤',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const broken_heart = {
	keywords: [
		'sad',
		'sorry',
		'break',
		'heart',
		'heartbreak',
	],
	char: '💔',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const heavy_heart_exclamation = {
	keywords: [
		'decoration',
		'love',
	],
	char: '❣',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const two_hearts = {
	keywords: [
		'love',
		'like',
		'affection',
		'valentines',
		'heart',
	],
	char: '💕',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const revolving_hearts = {
	keywords: [
		'love',
		'like',
		'affection',
		'valentines',
	],
	char: '💞',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const heartbeat = {
	keywords: [
		'love',
		'like',
		'affection',
		'valentines',
		'pink',
		'heart',
	],
	char: '💓',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const heartpulse = {
	keywords: [
		'like',
		'love',
		'affection',
		'valentines',
		'pink',
	],
	char: '💗',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const sparkling_heart = {
	keywords: [
		'love',
		'like',
		'affection',
		'valentines',
	],
	char: '💖',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const cupid = {
	keywords: [
		'love',
		'like',
		'heart',
		'affection',
		'valentines',
	],
	char: '💘',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const gift_heart = {
	keywords: [
		'love',
		'valentines',
	],
	char: '💝',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const heart_decoration = {
	keywords: [
		'purple-square',
		'love',
		'like',
	],
	char: '💟',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const peace_symbol = {
	keywords: [
		'hippie',
	],
	char: '☮',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const latin_cross = {
	keywords: [
		'christianity',
	],
	char: '✝',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const star_and_crescent = {
	keywords: [
		'islam',
	],
	char: '☪',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const om = {
	keywords: [
		'hinduism',
		'buddhism',
		'sikhism',
		'jainism',
	],
	char: '🕉',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const wheel_of_dharma = {
	keywords: [
		'hinduism',
		'buddhism',
		'sikhism',
		'jainism',
	],
	char: '☸',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const star_of_david = {
	keywords: [
		'judaism',
	],
	char: '✡',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const six_pointed_star = {
	keywords: [
		'purple-square',
		'religion',
		'jewish',
		'hexagram',
	],
	char: '🔯',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const menorah = {
	keywords: [
		'hanukkah',
		'candles',
		'jewish',
	],
	char: '🕎',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const yin_yang = {
	keywords: [
		'balance',
	],
	char: '☯',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const orthodox_cross = {
	keywords: [
		'suppedaneum',
		'religion',
	],
	char: '☦',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const place_of_worship = {
	keywords: [
		'religion',
		'church',
		'temple',
		'prayer',
	],
	char: '🛐',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const ophiuchus = {
	keywords: [
		'sign',
		'purple-square',
		'constellation',
		'astrology',
	],
	char: '⛎',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const aries = {
	keywords: [
		'sign',
		'purple-square',
		'zodiac',
		'astrology',
	],
	char: '♈',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const taurus = {
	keywords: [
		'purple-square',
		'sign',
		'zodiac',
		'astrology',
	],
	char: '♉',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const gemini = {
	keywords: [
		'sign',
		'zodiac',
		'purple-square',
		'astrology',
	],
	char: '♊',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const cancer = {
	keywords: [
		'sign',
		'zodiac',
		'purple-square',
		'astrology',
	],
	char: '♋',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const leo = {
	keywords: [
		'sign',
		'purple-square',
		'zodiac',
		'astrology',
	],
	char: '♌',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const virgo = {
	keywords: [
		'sign',
		'zodiac',
		'purple-square',
		'astrology',
	],
	char: '♍',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const libra = {
	keywords: [
		'sign',
		'purple-square',
		'zodiac',
		'astrology',
	],
	char: '♎',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const scorpius = {
	keywords: [
		'sign',
		'zodiac',
		'purple-square',
		'astrology',
		'scorpio',
	],
	char: '♏',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const sagittarius = {
	keywords: [
		'sign',
		'zodiac',
		'purple-square',
		'astrology',
	],
	char: '♐',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const capricorn = {
	keywords: [
		'sign',
		'zodiac',
		'purple-square',
		'astrology',
	],
	char: '♑',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const aquarius = {
	keywords: [
		'sign',
		'purple-square',
		'zodiac',
		'astrology',
	],
	char: '♒',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const pisces = {
	keywords: [
		'purple-square',
		'sign',
		'zodiac',
		'astrology',
	],
	char: '♓',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const id = {
	keywords: [
		'purple-square',
		'words',
	],
	char: '🆔',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const atom_symbol = {
	keywords: [
		'science',
		'physics',
		'chemistry',
	],
	char: '⚛',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const u7a7a = {
	keywords: [
		'kanji',
		'japanese',
		'chinese',
		'empty',
		'sky',
		'blue-square',
	],
	char: '🈳',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const u5272 = {
	keywords: [
		'cut',
		'divide',
		'chinese',
		'kanji',
		'pink-square',
	],
	char: '🈹',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const radioactive = {
	keywords: [
		'nuclear',
		'danger',
	],
	char: '☢',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const biohazard = {
	keywords: [
		'danger',
	],
	char: '☣',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const mobile_phone_off = {
	keywords: [
		'mute',
		'orange-square',
		'silence',
		'quiet',
	],
	char: '📴',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const vibration_mode = {
	keywords: [
		'orange-square',
		'phone',
	],
	char: '📳',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const u6709 = {
	keywords: [
		'orange-square',
		'chinese',
		'have',
		'kanji',
	],
	char: '🈶',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const u7121 = {
	keywords: [
		'nothing',
		'chinese',
		'kanji',
		'japanese',
		'orange-square',
	],
	char: '🈚',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const u7533 = {
	keywords: [
		'chinese',
		'japanese',
		'kanji',
		'orange-square',
	],
	char: '🈸',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const u55b6 = {
	keywords: [
		'japanese',
		'opening hours',
		'orange-square',
	],
	char: '🈺',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const u6708 = {
	keywords: [
		'chinese',
		'month',
		'moon',
		'japanese',
		'orange-square',
		'kanji',
	],
	char: '🈷️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const eight_pointed_black_star = {
	keywords: [
		'orange-square',
		'shape',
		'polygon',
	],
	char: '✴️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const vs = {
	keywords: [
		'words',
		'orange-square',
	],
	char: '🆚',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const accept = {
	keywords: [
		'ok',
		'good',
		'chinese',
		'kanji',
		'agree',
		'yes',
		'orange-circle',
	],
	char: '🉑',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const white_flower = {
	keywords: [
		'japanese',
		'spring',
	],
	char: '💮',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const ideograph_advantage = {
	keywords: [
		'chinese',
		'kanji',
		'obtain',
		'get',
		'circle',
	],
	char: '🉐',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const secret = {
	keywords: [
		'privacy',
		'chinese',
		'sshh',
		'kanji',
		'red-circle',
	],
	char: '㊙️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const congratulations = {
	keywords: [
		'chinese',
		'kanji',
		'japanese',
		'red-circle',
	],
	char: '㊗️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const u5408 = {
	keywords: [
		'japanese',
		'chinese',
		'join',
		'kanji',
		'red-square',
	],
	char: '🈴',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const u6e80 = {
	keywords: [
		'full',
		'chinese',
		'japanese',
		'red-square',
		'kanji',
	],
	char: '🈵',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const u7981 = {
	keywords: [
		'kanji',
		'japanese',
		'chinese',
		'forbidden',
		'limit',
		'restricted',
		'red-square',
	],
	char: '🈲',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const a = {
	keywords: [
		'red-square',
		'alphabet',
		'letter',
	],
	char: '🅰️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const b = {
	keywords: [
		'red-square',
		'alphabet',
		'letter',
	],
	char: '🅱️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const ab = {
	keywords: [
		'red-square',
		'alphabet',
	],
	char: '🆎',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const cl = {
	keywords: [
		'alphabet',
		'words',
		'red-square',
	],
	char: '🆑',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const o2 = {
	keywords: [
		'alphabet',
		'red-square',
		'letter',
	],
	char: '🅾️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const sos = {
	keywords: [
		'help',
		'red-square',
		'words',
		'emergency',
		'911',
	],
	char: '🆘',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const no_entry = {
	keywords: [
		'limit',
		'security',
		'privacy',
		'bad',
		'denied',
		'stop',
		'circle',
	],
	char: '⛔',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const name_badge = {
	keywords: [
		'fire',
		'forbid',
	],
	char: '📛',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const no_entry_sign = {
	keywords: [
		'forbid',
		'stop',
		'limit',
		'denied',
		'disallow',
		'circle',
	],
	char: '🚫',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const x = {
	keywords: [
		'no',
		'delete',
		'remove',
		'cancel',
		'red',
	],
	char: '❌',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const o = {
	keywords: [
		'circle',
		'round',
	],
	char: '⭕',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const stop_sign = {
	keywords: [
		'stop',
	],
	char: '🛑',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const anger = {
	keywords: [
		'angry',
		'mad',
	],
	char: '💢',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const hotsprings = {
	keywords: [
		'bath',
		'warm',
		'relax',
	],
	char: '♨️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const no_pedestrians = {
	keywords: [
		'rules',
		'crossing',
		'walking',
		'circle',
	],
	char: '🚷',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const do_not_litter = {
	keywords: [
		'trash',
		'bin',
		'garbage',
		'circle',
	],
	char: '🚯',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const no_bicycles = {
	keywords: [
		'cyclist',
		'prohibited',
		'circle',
	],
	char: '🚳',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const underage = {
	keywords: [
		'18',
		'drink',
		'pub',
		'night',
		'minor',
		'circle',
	],
	char: '🔞',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const no_mobile_phones = {
	keywords: [
		'iphone',
		'mute',
		'circle',
	],
	char: '📵',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const exclamation = {
	keywords: [
		'heavy_exclamation_mark',
		'danger',
		'surprise',
		'punctuation',
		'wow',
		'warning',
	],
	char: '❗',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const grey_exclamation = {
	keywords: [
		'surprise',
		'punctuation',
		'gray',
		'wow',
		'warning',
	],
	char: '❕',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const question = {
	keywords: [
		'doubt',
		'confused',
	],
	char: '❓',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const grey_question = {
	keywords: [
		'doubts',
		'gray',
		'huh',
		'confused',
	],
	char: '❔',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const bangbang = {
	keywords: [
		'exclamation',
		'surprise',
	],
	char: '‼️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const interrobang = {
	keywords: [
		'wat',
		'punctuation',
		'surprise',
	],
	char: '⁉️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const low_brightness = {
	keywords: [
		'sun',
		'afternoon',
		'warm',
		'summer',
	],
	char: '🔅',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const high_brightness = {
	keywords: [
		'sun',
		'light',
	],
	char: '🔆',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const trident = {
	keywords: [
		'weapon',
		'spear',
	],
	char: '🔱',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const fleur_de_lis = {
	keywords: [
		'decorative',
		'scout',
	],
	char: '⚜',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const part_alternation_mark = {
	keywords: [
		'graph',
		'presentation',
		'stats',
		'business',
		'economics',
		'bad',
	],
	char: '〽️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const warning = {
	keywords: [
		'exclamation',
		'wip',
		'alert',
		'error',
		'problem',
		'issue',
	],
	char: '⚠️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const children_crossing = {
	keywords: [
		'school',
		'warning',
		'danger',
		'sign',
		'driving',
		'yellow-diamond',
	],
	char: '🚸',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const beginner = {
	keywords: [
		'badge',
		'shield',
	],
	char: '🔰',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const recycle = {
	keywords: [
		'arrow',
		'environment',
		'garbage',
		'trash',
	],
	char: '♻️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const u6307 = {
	keywords: [
		'chinese',
		'point',
		'green-square',
		'kanji',
	],
	char: '🈯',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const chart = {
	keywords: [
		'green-square',
		'graph',
		'presentation',
		'stats',
	],
	char: '💹',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const sparkle = {
	keywords: [
		'stars',
		'green-square',
		'awesome',
		'good',
		'fireworks',
	],
	char: '❇️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const eight_spoked_asterisk = {
	keywords: [
		'star',
		'sparkle',
		'green-square',
	],
	char: '✳️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const negative_squared_cross_mark = {
	keywords: [
		'x',
		'green-square',
		'no',
		'deny',
	],
	char: '❎',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const white_check_mark = {
	keywords: [
		'green-square',
		'ok',
		'agree',
		'vote',
		'election',
		'answer',
		'tick',
	],
	char: '✅',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const diamond_shape_with_a_dot_inside = {
	keywords: [
		'jewel',
		'blue',
		'gem',
		'crystal',
		'fancy',
	],
	char: '💠',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const cyclone = {
	keywords: [
		'weather',
		'swirl',
		'blue',
		'cloud',
		'vortex',
		'spiral',
		'whirlpool',
		'spin',
		'tornado',
		'hurricane',
		'typhoon',
	],
	char: '🌀',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const loop = {
	keywords: [
		'tape',
		'cassette',
	],
	char: '➿',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const globe_with_meridians = {
	keywords: [
		'earth',
		'international',
		'world',
		'internet',
		'interweb',
		'i18n',
	],
	char: '🌐',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const m = {
	keywords: [
		'alphabet',
		'blue-circle',
		'letter',
	],
	char: 'Ⓜ️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const atm = {
	keywords: [
		'money',
		'sales',
		'cash',
		'blue-square',
		'payment',
		'bank',
	],
	char: '🏧',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const sa = {
	keywords: [
		'japanese',
		'blue-square',
		'katakana',
	],
	char: '🈂️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const passport_control = {
	keywords: [
		'custom',
		'blue-square',
	],
	char: '🛂',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const customs = {
	keywords: [
		'passport',
		'border',
		'blue-square',
	],
	char: '🛃',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const baggage_claim = {
	keywords: [
		'blue-square',
		'airport',
		'transport',
	],
	char: '🛄',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const left_luggage = {
	keywords: [
		'blue-square',
		'travel',
	],
	char: '🛅',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const wheelchair = {
	keywords: [
		'blue-square',
		'disabled',
		'a11y',
		'accessibility',
	],
	char: '♿',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const no_smoking = {
	keywords: [
		'cigarette',
		'blue-square',
		'smell',
		'smoke',
	],
	char: '🚭',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const wc = {
	keywords: [
		'toilet',
		'restroom',
		'blue-square',
	],
	char: '🚾',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const parking = {
	keywords: [
		'cars',
		'blue-square',
		'alphabet',
		'letter',
	],
	char: '🅿️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const potable_water = {
	keywords: [
		'blue-square',
		'liquid',
		'restroom',
		'cleaning',
		'faucet',
	],
	char: '🚰',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const mens = {
	keywords: [
		'toilet',
		'restroom',
		'wc',
		'blue-square',
		'gender',
		'male',
	],
	char: '🚹',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const womens = {
	keywords: [
		'purple-square',
		'woman',
		'female',
		'toilet',
		'loo',
		'restroom',
		'gender',
	],
	char: '🚺',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const baby_symbol = {
	keywords: [
		'orange-square',
		'child',
	],
	char: '🚼',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const restroom = {
	keywords: [
		'blue-square',
		'toilet',
		'refresh',
		'wc',
		'gender',
	],
	char: '🚻',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const put_litter_in_its_place = {
	keywords: [
		'blue-square',
		'sign',
		'human',
		'info',
	],
	char: '🚮',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const cinema = {
	keywords: [
		'blue-square',
		'record',
		'film',
		'movie',
		'curtain',
		'stage',
		'theater',
	],
	char: '🎦',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const signal_strength = {
	keywords: [
		'blue-square',
		'reception',
		'phone',
		'internet',
		'connection',
		'wifi',
		'bluetooth',
		'bars',
	],
	char: '📶',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const koko = {
	keywords: [
		'blue-square',
		'here',
		'katakana',
		'japanese',
		'destination',
	],
	char: '🈁',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const ng = {
	keywords: [
		'blue-square',
		'words',
		'shape',
		'icon',
	],
	char: '🆖',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const ok = {
	keywords: [
		'good',
		'agree',
		'yes',
		'blue-square',
	],
	char: '🆗',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const up = {
	keywords: [
		'blue-square',
		'above',
		'high',
	],
	char: '🆙',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const cool = {
	keywords: [
		'words',
		'blue-square',
	],
	char: '🆒',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const free = {
	keywords: [
		'blue-square',
		'words',
	],
	char: '🆓',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const zero = {
	keywords: [
		'0',
		'numbers',
		'blue-square',
		'null',
	],
	char: '0️⃣',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const one = {
	keywords: [
		'blue-square',
		'numbers',
		'1',
	],
	char: '1️⃣',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const two = {
	keywords: [
		'numbers',
		'2',
		'prime',
		'blue-square',
	],
	char: '2️⃣',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const three = {
	keywords: [
		'3',
		'numbers',
		'prime',
		'blue-square',
	],
	char: '3️⃣',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const four = {
	keywords: [
		'4',
		'numbers',
		'blue-square',
	],
	char: '4️⃣',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const five = {
	keywords: [
		'5',
		'numbers',
		'blue-square',
		'prime',
	],
	char: '5️⃣',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const six = {
	keywords: [
		'6',
		'numbers',
		'blue-square',
	],
	char: '6️⃣',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const seven = {
	keywords: [
		'7',
		'numbers',
		'blue-square',
		'prime',
	],
	char: '7️⃣',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const eight = {
	keywords: [
		'8',
		'blue-square',
		'numbers',
	],
	char: '8️⃣',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const nine = {
	keywords: [
		'blue-square',
		'numbers',
		'9',
	],
	char: '9️⃣',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const keycap_ten = {
	keywords: [
		'numbers',
		'10',
		'blue-square',
	],
	char: '🔟',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const asterisk = {
	keywords: [
		'star',
		'keycap',
	],
	char: '*⃣',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const eject_button = {
	keywords: [
		'blue-square',
	],
	char: '⏏️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const arrow_forward = {
	keywords: [
		'blue-square',
		'right',
		'direction',
		'play',
	],
	char: '▶️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const pause_button = {
	keywords: [
		'pause',
		'blue-square',
	],
	char: '⏸',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const next_track_button = {
	keywords: [
		'forward',
		'next',
		'blue-square',
	],
	char: '⏭',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const stop_button = {
	keywords: [
		'blue-square',
	],
	char: '⏹',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const record_button = {
	keywords: [
		'blue-square',
	],
	char: '⏺',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const play_or_pause_button = {
	keywords: [
		'blue-square',
		'play',
		'pause',
	],
	char: '⏯',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const previous_track_button = {
	keywords: [
		'backward',
	],
	char: '⏮',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const fast_forward = {
	keywords: [
		'blue-square',
		'play',
		'speed',
		'continue',
	],
	char: '⏩',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const rewind = {
	keywords: [
		'play',
		'blue-square',
	],
	char: '⏪',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const twisted_rightwards_arrows = {
	keywords: [
		'blue-square',
		'shuffle',
		'music',
		'random',
	],
	char: '🔀',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const repeat = {
	keywords: [
		'loop',
		'record',
	],
	char: '🔁',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const repeat_one = {
	keywords: [
		'blue-square',
		'loop',
	],
	char: '🔂',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const arrow_backward = {
	keywords: [
		'blue-square',
		'left',
		'direction',
	],
	char: '◀️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const arrow_up_small = {
	keywords: [
		'blue-square',
		'triangle',
		'direction',
		'point',
		'forward',
		'top',
	],
	char: '🔼',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const arrow_down_small = {
	keywords: [
		'blue-square',
		'direction',
		'bottom',
	],
	char: '🔽',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const arrow_double_up = {
	keywords: [
		'blue-square',
		'direction',
		'top',
	],
	char: '⏫',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const arrow_double_down = {
	keywords: [
		'blue-square',
		'direction',
		'bottom',
	],
	char: '⏬',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const arrow_right = {
	keywords: [
		'blue-square',
		'next',
	],
	char: '➡️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const arrow_left = {
	keywords: [
		'blue-square',
		'previous',
		'back',
	],
	char: '⬅️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const arrow_up = {
	keywords: [
		'blue-square',
		'continue',
		'top',
		'direction',
	],
	char: '⬆️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const arrow_down = {
	keywords: [
		'blue-square',
		'direction',
		'bottom',
	],
	char: '⬇️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const arrow_upper_right = {
	keywords: [
		'blue-square',
		'point',
		'direction',
		'diagonal',
		'northeast',
	],
	char: '↗️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const arrow_lower_right = {
	keywords: [
		'blue-square',
		'direction',
		'diagonal',
		'southeast',
	],
	char: '↘️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const arrow_lower_left = {
	keywords: [
		'blue-square',
		'direction',
		'diagonal',
		'southwest',
	],
	char: '↙️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const arrow_upper_left = {
	keywords: [
		'blue-square',
		'point',
		'direction',
		'diagonal',
		'northwest',
	],
	char: '↖️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const arrow_up_down = {
	keywords: [
		'blue-square',
		'direction',
		'way',
		'vertical',
	],
	char: '↕️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const left_right_arrow = {
	keywords: [
		'shape',
		'direction',
		'horizontal',
		'sideways',
	],
	char: '↔️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const arrows_counterclockwise = {
	keywords: [
		'blue-square',
		'sync',
		'cycle',
	],
	char: '🔄',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const arrow_right_hook = {
	keywords: [
		'blue-square',
		'return',
		'rotate',
		'direction',
	],
	char: '↪️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const leftwards_arrow_with_hook = {
	keywords: [
		'back',
		'return',
		'blue-square',
		'undo',
		'enter',
	],
	char: '↩️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const arrow_heading_up = {
	keywords: [
		'blue-square',
		'direction',
		'top',
	],
	char: '⤴️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const arrow_heading_down = {
	keywords: [
		'blue-square',
		'direction',
		'bottom',
	],
	char: '⤵️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const hash = {
	keywords: [
		'symbol',
		'blue-square',
		'twitter',
	],
	char: '#️⃣',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const information_source = {
	keywords: [
		'blue-square',
		'alphabet',
		'letter',
	],
	char: 'ℹ️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const abc = {
	keywords: [
		'blue-square',
		'alphabet',
	],
	char: '🔤',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const abcd = {
	keywords: [
		'blue-square',
		'alphabet',
	],
	char: '🔡',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const capital_abcd = {
	keywords: [
		'alphabet',
		'words',
		'blue-square',
	],
	char: '🔠',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const symbols = {
	keywords: [
		'blue-square',
		'music',
		'note',
		'ampersand',
		'percent',
		'glyphs',
		'characters',
	],
	char: '🔣',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const musical_note = {
	keywords: [
		'score',
		'tone',
		'sound',
	],
	char: '🎵',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const notes = {
	keywords: [
		'music',
		'score',
	],
	char: '🎶',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const wavy_dash = {
	keywords: [
		'draw',
		'line',
		'moustache',
		'mustache',
		'squiggle',
		'scribble',
	],
	char: '〰️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const curly_loop = {
	keywords: [
		'scribble',
		'draw',
		'shape',
		'squiggle',
	],
	char: '➰',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const heavy_check_mark = {
	keywords: [
		'ok',
		'nike',
		'answer',
		'yes',
		'tick',
	],
	char: '✔️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const arrows_clockwise = {
	keywords: [
		'sync',
		'cycle',
		'round',
		'repeat',
	],
	char: '🔃',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const heavy_plus_sign = {
	keywords: [
		'math',
		'calculation',
		'addition',
		'more',
		'increase',
	],
	char: '➕',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const heavy_minus_sign = {
	keywords: [
		'math',
		'calculation',
		'subtract',
		'less',
	],
	char: '➖',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const heavy_division_sign = {
	keywords: [
		'divide',
		'math',
		'calculation',
	],
	char: '➗',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const heavy_multiplication_x = {
	keywords: [
		'math',
		'calculation',
	],
	char: '✖️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const infinity = {
	keywords: [
		'forever',
	],
	char: '♾',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const heavy_dollar_sign = {
	keywords: [
		'money',
		'sales',
		'payment',
		'currency',
		'buck',
	],
	char: '💲',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const currency_exchange = {
	keywords: [
		'money',
		'sales',
		'dollar',
		'travel',
	],
	char: '💱',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const copyright = {
	keywords: [
		'ip',
		'license',
		'circle',
		'law',
		'legal',
	],
	char: '©️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const registered = {
	keywords: [
		'alphabet',
		'circle',
	],
	char: '®️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const tm = {
	keywords: [
		'trademark',
		'brand',
		'law',
		'legal',
	],
	char: '™️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const end = {
	keywords: [
		'words',
		'arrow',
	],
	char: '🔚',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const back = {
	keywords: [
		'arrow',
		'words',
		'return',
	],
	char: '🔙',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const on = {
	keywords: [
		'arrow',
		'words',
	],
	char: '🔛',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const top = {
	keywords: [
		'words',
		'blue-square',
	],
	char: '🔝',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const soon = {
	keywords: [
		'arrow',
		'words',
	],
	char: '🔜',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const ballot_box_with_check = {
	keywords: [
		'ok',
		'agree',
		'confirm',
		'black-square',
		'vote',
		'election',
		'yes',
		'tick',
	],
	char: '☑️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const radio_button = {
	keywords: [
		'input',
		'old',
		'music',
		'circle',
	],
	char: '🔘',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const white_circle = {
	keywords: [
		'shape',
		'round',
	],
	char: '⚪',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const black_circle = {
	keywords: [
		'shape',
		'button',
		'round',
	],
	char: '⚫',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const red_circle = {
	keywords: [
		'shape',
		'error',
		'danger',
	],
	char: '🔴',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const large_blue_circle = {
	keywords: [
		'shape',
		'icon',
		'button',
	],
	char: '🔵',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const small_orange_diamond = {
	keywords: [
		'shape',
		'jewel',
		'gem',
	],
	char: '🔸',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const small_blue_diamond = {
	keywords: [
		'shape',
		'jewel',
		'gem',
	],
	char: '🔹',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const large_orange_diamond = {
	keywords: [
		'shape',
		'jewel',
		'gem',
	],
	char: '🔶',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const large_blue_diamond = {
	keywords: [
		'shape',
		'jewel',
		'gem',
	],
	char: '🔷',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const small_red_triangle = {
	keywords: [
		'shape',
		'direction',
		'up',
		'top',
	],
	char: '🔺',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const black_small_square = {
	keywords: [
		'shape',
		'icon',
	],
	char: '▪️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const white_small_square = {
	keywords: [
		'shape',
		'icon',
	],
	char: '▫️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const black_large_square = {
	keywords: [
		'shape',
		'icon',
		'button',
	],
	char: '⬛',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const white_large_square = {
	keywords: [
		'shape',
		'icon',
		'stone',
		'button',
	],
	char: '⬜',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const small_red_triangle_down = {
	keywords: [
		'shape',
		'direction',
		'bottom',
	],
	char: '🔻',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const black_medium_square = {
	keywords: [
		'shape',
		'button',
		'icon',
	],
	char: '◼️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const white_medium_square = {
	keywords: [
		'shape',
		'stone',
		'icon',
	],
	char: '◻️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const black_medium_small_square = {
	keywords: [
		'icon',
		'shape',
		'button',
	],
	char: '◾',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const white_medium_small_square = {
	keywords: [
		'shape',
		'stone',
		'icon',
		'button',
	],
	char: '◽',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const black_square_button = {
	keywords: [
		'shape',
		'input',
		'frame',
	],
	char: '🔲',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const white_square_button = {
	keywords: [
		'shape',
		'input',
	],
	char: '🔳',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const speaker = {
	keywords: [
		'sound',
		'volume',
		'silence',
		'broadcast',
	],
	char: '🔈',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const sound = {
	keywords: [
		'volume',
		'speaker',
		'broadcast',
	],
	char: '🔉',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const loud_sound = {
	keywords: [
		'volume',
		'noise',
		'noisy',
		'speaker',
		'broadcast',
	],
	char: '🔊',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const mute = {
	keywords: [
		'sound',
		'volume',
		'silence',
		'quiet',
	],
	char: '🔇',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const mega = {
	keywords: [
		'sound',
		'speaker',
		'volume',
	],
	char: '📣',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const loudspeaker = {
	keywords: [
		'volume',
		'sound',
	],
	char: '📢',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const bell = {
	keywords: [
		'sound',
		'notification',
		'christmas',
		'xmas',
		'chime',
	],
	char: '🔔',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const no_bell = {
	keywords: [
		'sound',
		'volume',
		'mute',
		'quiet',
		'silent',
	],
	char: '🔕',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const black_joker = {
	keywords: [
		'poker',
		'cards',
		'game',
		'play',
		'magic',
	],
	char: '🃏',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const mahjong = {
	keywords: [
		'game',
		'play',
		'chinese',
		'kanji',
	],
	char: '🀄',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const spades = {
	keywords: [
		'poker',
		'cards',
		'suits',
		'magic',
	],
	char: '♠️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clubs = {
	keywords: [
		'poker',
		'cards',
		'magic',
		'suits',
	],
	char: '♣️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const hearts = {
	keywords: [
		'poker',
		'cards',
		'magic',
		'suits',
	],
	char: '♥️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const diamonds = {
	keywords: [
		'poker',
		'cards',
		'magic',
		'suits',
	],
	char: '♦️',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const flower_playing_cards = {
	keywords: [
		'game',
		'sunset',
		'red',
	],
	char: '🎴',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const thought_balloon = {
	keywords: [
		'bubble',
		'cloud',
		'speech',
		'thinking',
		'dream',
	],
	char: '💭',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const right_anger_bubble = {
	keywords: [
		'caption',
		'speech',
		'thinking',
		'mad',
	],
	char: '🗯',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const speech_balloon = {
	keywords: [
		'bubble',
		'words',
		'message',
		'talk',
		'chatting',
	],
	char: '💬',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const left_speech_bubble = {
	keywords: [
		'words',
		'message',
		'talk',
		'chatting',
	],
	char: '🗨',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock1 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
	],
	char: '🕐',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock2 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
	],
	char: '🕑',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock3 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
	],
	char: '🕒',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock4 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
	],
	char: '🕓',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock5 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
	],
	char: '🕔',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock6 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
		'dawn',
		'dusk',
	],
	char: '🕕',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock7 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
	],
	char: '🕖',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock8 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
	],
	char: '🕗',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock9 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
	],
	char: '🕘',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock10 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
	],
	char: '🕙',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock11 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
	],
	char: '🕚',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock12 = {
	keywords: [
		'time',
		'noon',
		'midnight',
		'midday',
		'late',
		'early',
		'schedule',
	],
	char: '🕛',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock130 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
	],
	char: '🕜',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock230 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
	],
	char: '🕝',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock330 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
	],
	char: '🕞',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock430 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
	],
	char: '🕟',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock530 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
	],
	char: '🕠',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock630 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
	],
	char: '🕡',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock730 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
	],
	char: '🕢',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock830 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
	],
	char: '🕣',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock930 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
	],
	char: '🕤',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock1030 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
	],
	char: '🕥',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock1130 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
	],
	char: '🕦',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const clock1230 = {
	keywords: [
		'time',
		'late',
		'early',
		'schedule',
	],
	char: '🕧',
	fitzpatrick_scale: false,
	category: 'symbols',
};
const afghanistan = {
	keywords: [
		'af',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇦🇫',
	fitzpatrick_scale: false,
	category: 'flags',
};
const aland_islands = {
	keywords: [
		'Åland',
		'islands',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇦🇽',
	fitzpatrick_scale: false,
	category: 'flags',
};
const albania = {
	keywords: [
		'al',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇦🇱',
	fitzpatrick_scale: false,
	category: 'flags',
};
const algeria = {
	keywords: [
		'dz',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇩🇿',
	fitzpatrick_scale: false,
	category: 'flags',
};
const american_samoa = {
	keywords: [
		'american',
		'ws',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇦🇸',
	fitzpatrick_scale: false,
	category: 'flags',
};
const andorra = {
	keywords: [
		'ad',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇦🇩',
	fitzpatrick_scale: false,
	category: 'flags',
};
const angola = {
	keywords: [
		'ao',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇦🇴',
	fitzpatrick_scale: false,
	category: 'flags',
};
const anguilla = {
	keywords: [
		'ai',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇦🇮',
	fitzpatrick_scale: false,
	category: 'flags',
};
const antarctica = {
	keywords: [
		'aq',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇦🇶',
	fitzpatrick_scale: false,
	category: 'flags',
};
const antigua_barbuda = {
	keywords: [
		'antigua',
		'barbuda',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇦🇬',
	fitzpatrick_scale: false,
	category: 'flags',
};
const argentina = {
	keywords: [
		'ar',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇦🇷',
	fitzpatrick_scale: false,
	category: 'flags',
};
const armenia = {
	keywords: [
		'am',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇦🇲',
	fitzpatrick_scale: false,
	category: 'flags',
};
const aruba = {
	keywords: [
		'aw',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇦🇼',
	fitzpatrick_scale: false,
	category: 'flags',
};
const australia = {
	keywords: [
		'au',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇦🇺',
	fitzpatrick_scale: false,
	category: 'flags',
};
const austria = {
	keywords: [
		'at',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇦🇹',
	fitzpatrick_scale: false,
	category: 'flags',
};
const azerbaijan = {
	keywords: [
		'az',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇦🇿',
	fitzpatrick_scale: false,
	category: 'flags',
};
const bahamas = {
	keywords: [
		'bs',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇧🇸',
	fitzpatrick_scale: false,
	category: 'flags',
};
const bahrain = {
	keywords: [
		'bh',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇧🇭',
	fitzpatrick_scale: false,
	category: 'flags',
};
const bangladesh = {
	keywords: [
		'bd',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇧🇩',
	fitzpatrick_scale: false,
	category: 'flags',
};
const barbados = {
	keywords: [
		'bb',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇧🇧',
	fitzpatrick_scale: false,
	category: 'flags',
};
const belarus = {
	keywords: [
		'by',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇧🇾',
	fitzpatrick_scale: false,
	category: 'flags',
};
const belgium = {
	keywords: [
		'be',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇧🇪',
	fitzpatrick_scale: false,
	category: 'flags',
};
const belize = {
	keywords: [
		'bz',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇧🇿',
	fitzpatrick_scale: false,
	category: 'flags',
};
const benin = {
	keywords: [
		'bj',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇧🇯',
	fitzpatrick_scale: false,
	category: 'flags',
};
const bermuda = {
	keywords: [
		'bm',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇧🇲',
	fitzpatrick_scale: false,
	category: 'flags',
};
const bhutan = {
	keywords: [
		'bt',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇧🇹',
	fitzpatrick_scale: false,
	category: 'flags',
};
const bolivia = {
	keywords: [
		'bo',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇧🇴',
	fitzpatrick_scale: false,
	category: 'flags',
};
const caribbean_netherlands = {
	keywords: [
		'bonaire',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇧🇶',
	fitzpatrick_scale: false,
	category: 'flags',
};
const bosnia_herzegovina = {
	keywords: [
		'bosnia',
		'herzegovina',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇧🇦',
	fitzpatrick_scale: false,
	category: 'flags',
};
const botswana = {
	keywords: [
		'bw',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇧🇼',
	fitzpatrick_scale: false,
	category: 'flags',
};
const brazil = {
	keywords: [
		'br',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇧🇷',
	fitzpatrick_scale: false,
	category: 'flags',
};
const british_indian_ocean_territory = {
	keywords: [
		'british',
		'indian',
		'ocean',
		'territory',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇮🇴',
	fitzpatrick_scale: false,
	category: 'flags',
};
const british_virgin_islands = {
	keywords: [
		'british',
		'virgin',
		'islands',
		'bvi',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇻🇬',
	fitzpatrick_scale: false,
	category: 'flags',
};
const brunei = {
	keywords: [
		'bn',
		'darussalam',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇧🇳',
	fitzpatrick_scale: false,
	category: 'flags',
};
const bulgaria = {
	keywords: [
		'bg',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇧🇬',
	fitzpatrick_scale: false,
	category: 'flags',
};
const burkina_faso = {
	keywords: [
		'burkina',
		'faso',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇧🇫',
	fitzpatrick_scale: false,
	category: 'flags',
};
const burundi = {
	keywords: [
		'bi',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇧🇮',
	fitzpatrick_scale: false,
	category: 'flags',
};
const cape_verde = {
	keywords: [
		'cabo',
		'verde',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇨🇻',
	fitzpatrick_scale: false,
	category: 'flags',
};
const cambodia = {
	keywords: [
		'kh',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇰🇭',
	fitzpatrick_scale: false,
	category: 'flags',
};
const cameroon = {
	keywords: [
		'cm',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇨🇲',
	fitzpatrick_scale: false,
	category: 'flags',
};
const canada = {
	keywords: [
		'ca',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇨🇦',
	fitzpatrick_scale: false,
	category: 'flags',
};
const canary_islands = {
	keywords: [
		'canary',
		'islands',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇮🇨',
	fitzpatrick_scale: false,
	category: 'flags',
};
const cayman_islands = {
	keywords: [
		'cayman',
		'islands',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇰🇾',
	fitzpatrick_scale: false,
	category: 'flags',
};
const central_african_republic = {
	keywords: [
		'central',
		'african',
		'republic',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇨🇫',
	fitzpatrick_scale: false,
	category: 'flags',
};
const chad = {
	keywords: [
		'td',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇹🇩',
	fitzpatrick_scale: false,
	category: 'flags',
};
const chile = {
	keywords: [
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇨🇱',
	fitzpatrick_scale: false,
	category: 'flags',
};
const cn = {
	keywords: [
		'china',
		'chinese',
		'prc',
		'flag',
		'country',
		'nation',
		'banner',
	],
	char: '🇨🇳',
	fitzpatrick_scale: false,
	category: 'flags',
};
const christmas_island = {
	keywords: [
		'christmas',
		'island',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇨🇽',
	fitzpatrick_scale: false,
	category: 'flags',
};
const cocos_islands = {
	keywords: [
		'cocos',
		'keeling',
		'islands',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇨🇨',
	fitzpatrick_scale: false,
	category: 'flags',
};
const colombia = {
	keywords: [
		'co',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇨🇴',
	fitzpatrick_scale: false,
	category: 'flags',
};
const comoros = {
	keywords: [
		'km',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇰🇲',
	fitzpatrick_scale: false,
	category: 'flags',
};
const congo_brazzaville = {
	keywords: [
		'congo',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇨🇬',
	fitzpatrick_scale: false,
	category: 'flags',
};
const congo_kinshasa = {
	keywords: [
		'congo',
		'democratic',
		'republic',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇨🇩',
	fitzpatrick_scale: false,
	category: 'flags',
};
const cook_islands = {
	keywords: [
		'cook',
		'islands',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇨🇰',
	fitzpatrick_scale: false,
	category: 'flags',
};
const costa_rica = {
	keywords: [
		'costa',
		'rica',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇨🇷',
	fitzpatrick_scale: false,
	category: 'flags',
};
const croatia = {
	keywords: [
		'hr',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇭🇷',
	fitzpatrick_scale: false,
	category: 'flags',
};
const cuba = {
	keywords: [
		'cu',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇨🇺',
	fitzpatrick_scale: false,
	category: 'flags',
};
const curacao = {
	keywords: [
		'curaçao',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇨🇼',
	fitzpatrick_scale: false,
	category: 'flags',
};
const cyprus = {
	keywords: [
		'cy',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇨🇾',
	fitzpatrick_scale: false,
	category: 'flags',
};
const czech_republic = {
	keywords: [
		'cz',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇨🇿',
	fitzpatrick_scale: false,
	category: 'flags',
};
const denmark = {
	keywords: [
		'dk',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇩🇰',
	fitzpatrick_scale: false,
	category: 'flags',
};
const djibouti = {
	keywords: [
		'dj',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇩🇯',
	fitzpatrick_scale: false,
	category: 'flags',
};
const dominica = {
	keywords: [
		'dm',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇩🇲',
	fitzpatrick_scale: false,
	category: 'flags',
};
const dominican_republic = {
	keywords: [
		'dominican',
		'republic',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇩🇴',
	fitzpatrick_scale: false,
	category: 'flags',
};
const ecuador = {
	keywords: [
		'ec',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇪🇨',
	fitzpatrick_scale: false,
	category: 'flags',
};
const egypt = {
	keywords: [
		'eg',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇪🇬',
	fitzpatrick_scale: false,
	category: 'flags',
};
const el_salvador = {
	keywords: [
		'el',
		'salvador',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇸🇻',
	fitzpatrick_scale: false,
	category: 'flags',
};
const equatorial_guinea = {
	keywords: [
		'equatorial',
		'gn',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇬🇶',
	fitzpatrick_scale: false,
	category: 'flags',
};
const eritrea = {
	keywords: [
		'er',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇪🇷',
	fitzpatrick_scale: false,
	category: 'flags',
};
const estonia = {
	keywords: [
		'ee',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇪🇪',
	fitzpatrick_scale: false,
	category: 'flags',
};
const ethiopia = {
	keywords: [
		'et',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇪🇹',
	fitzpatrick_scale: false,
	category: 'flags',
};
const eu = {
	keywords: [
		'european',
		'union',
		'flag',
		'banner',
	],
	char: '🇪🇺',
	fitzpatrick_scale: false,
	category: 'flags',
};
const falkland_islands = {
	keywords: [
		'falkland',
		'islands',
		'malvinas',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇫🇰',
	fitzpatrick_scale: false,
	category: 'flags',
};
const faroe_islands = {
	keywords: [
		'faroe',
		'islands',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇫🇴',
	fitzpatrick_scale: false,
	category: 'flags',
};
const fiji = {
	keywords: [
		'fj',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇫🇯',
	fitzpatrick_scale: false,
	category: 'flags',
};
const finland = {
	keywords: [
		'fi',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇫🇮',
	fitzpatrick_scale: false,
	category: 'flags',
};
const fr = {
	keywords: [
		'banner',
		'flag',
		'nation',
		'france',
		'french',
		'country',
	],
	char: '🇫🇷',
	fitzpatrick_scale: false,
	category: 'flags',
};
const french_guiana = {
	keywords: [
		'french',
		'guiana',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇬🇫',
	fitzpatrick_scale: false,
	category: 'flags',
};
const french_polynesia = {
	keywords: [
		'french',
		'polynesia',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇵🇫',
	fitzpatrick_scale: false,
	category: 'flags',
};
const french_southern_territories = {
	keywords: [
		'french',
		'southern',
		'territories',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇹🇫',
	fitzpatrick_scale: false,
	category: 'flags',
};
const gabon = {
	keywords: [
		'ga',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇬🇦',
	fitzpatrick_scale: false,
	category: 'flags',
};
const gambia = {
	keywords: [
		'gm',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇬🇲',
	fitzpatrick_scale: false,
	category: 'flags',
};
const georgia = {
	keywords: [
		'ge',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇬🇪',
	fitzpatrick_scale: false,
	category: 'flags',
};
const de = {
	keywords: [
		'german',
		'nation',
		'flag',
		'country',
		'banner',
	],
	char: '🇩🇪',
	fitzpatrick_scale: false,
	category: 'flags',
};
const ghana = {
	keywords: [
		'gh',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇬🇭',
	fitzpatrick_scale: false,
	category: 'flags',
};
const gibraltar = {
	keywords: [
		'gi',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇬🇮',
	fitzpatrick_scale: false,
	category: 'flags',
};
const greece = {
	keywords: [
		'gr',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇬🇷',
	fitzpatrick_scale: false,
	category: 'flags',
};
const greenland = {
	keywords: [
		'gl',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇬🇱',
	fitzpatrick_scale: false,
	category: 'flags',
};
const grenada = {
	keywords: [
		'gd',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇬🇩',
	fitzpatrick_scale: false,
	category: 'flags',
};
const guadeloupe = {
	keywords: [
		'gp',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇬🇵',
	fitzpatrick_scale: false,
	category: 'flags',
};
const guam = {
	keywords: [
		'gu',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇬🇺',
	fitzpatrick_scale: false,
	category: 'flags',
};
const guatemala = {
	keywords: [
		'gt',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇬🇹',
	fitzpatrick_scale: false,
	category: 'flags',
};
const guernsey = {
	keywords: [
		'gg',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇬🇬',
	fitzpatrick_scale: false,
	category: 'flags',
};
const guinea = {
	keywords: [
		'gn',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇬🇳',
	fitzpatrick_scale: false,
	category: 'flags',
};
const guinea_bissau = {
	keywords: [
		'gw',
		'bissau',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇬🇼',
	fitzpatrick_scale: false,
	category: 'flags',
};
const guyana = {
	keywords: [
		'gy',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇬🇾',
	fitzpatrick_scale: false,
	category: 'flags',
};
const haiti = {
	keywords: [
		'ht',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇭🇹',
	fitzpatrick_scale: false,
	category: 'flags',
};
const honduras = {
	keywords: [
		'hn',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇭🇳',
	fitzpatrick_scale: false,
	category: 'flags',
};
const hong_kong = {
	keywords: [
		'hong',
		'kong',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇭🇰',
	fitzpatrick_scale: false,
	category: 'flags',
};
const hungary = {
	keywords: [
		'hu',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇭🇺',
	fitzpatrick_scale: false,
	category: 'flags',
};
const iceland = {
	keywords: [
		'is',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇮🇸',
	fitzpatrick_scale: false,
	category: 'flags',
};
const india = {
	keywords: [
		'in',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇮🇳',
	fitzpatrick_scale: false,
	category: 'flags',
};
const indonesia = {
	keywords: [
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇮🇩',
	fitzpatrick_scale: false,
	category: 'flags',
};
const iran = {
	keywords: [
		'iran,',
		'islamic',
		'republic',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇮🇷',
	fitzpatrick_scale: false,
	category: 'flags',
};
const iraq = {
	keywords: [
		'iq',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇮🇶',
	fitzpatrick_scale: false,
	category: 'flags',
};
const ireland = {
	keywords: [
		'ie',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇮🇪',
	fitzpatrick_scale: false,
	category: 'flags',
};
const isle_of_man = {
	keywords: [
		'isle',
		'man',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇮🇲',
	fitzpatrick_scale: false,
	category: 'flags',
};
const israel = {
	keywords: [
		'il',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇮🇱',
	fitzpatrick_scale: false,
	category: 'flags',
};
const it = {
	keywords: [
		'italy',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇮🇹',
	fitzpatrick_scale: false,
	category: 'flags',
};
const cote_divoire = {
	keywords: [
		'ivory',
		'coast',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇨🇮',
	fitzpatrick_scale: false,
	category: 'flags',
};
const jamaica = {
	keywords: [
		'jm',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇯🇲',
	fitzpatrick_scale: false,
	category: 'flags',
};
const jp = {
	keywords: [
		'japanese',
		'nation',
		'flag',
		'country',
		'banner',
	],
	char: '🇯🇵',
	fitzpatrick_scale: false,
	category: 'flags',
};
const jersey = {
	keywords: [
		'je',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇯🇪',
	fitzpatrick_scale: false,
	category: 'flags',
};
const jordan = {
	keywords: [
		'jo',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇯🇴',
	fitzpatrick_scale: false,
	category: 'flags',
};
const kazakhstan = {
	keywords: [
		'kz',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇰🇿',
	fitzpatrick_scale: false,
	category: 'flags',
};
const kenya = {
	keywords: [
		'ke',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇰🇪',
	fitzpatrick_scale: false,
	category: 'flags',
};
const kiribati = {
	keywords: [
		'ki',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇰🇮',
	fitzpatrick_scale: false,
	category: 'flags',
};
const kosovo = {
	keywords: [
		'xk',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇽🇰',
	fitzpatrick_scale: false,
	category: 'flags',
};
const kuwait = {
	keywords: [
		'kw',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇰🇼',
	fitzpatrick_scale: false,
	category: 'flags',
};
const kyrgyzstan = {
	keywords: [
		'kg',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇰🇬',
	fitzpatrick_scale: false,
	category: 'flags',
};
const laos = {
	keywords: [
		'lao',
		'democratic',
		'republic',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇱🇦',
	fitzpatrick_scale: false,
	category: 'flags',
};
const latvia = {
	keywords: [
		'lv',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇱🇻',
	fitzpatrick_scale: false,
	category: 'flags',
};
const lebanon = {
	keywords: [
		'lb',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇱🇧',
	fitzpatrick_scale: false,
	category: 'flags',
};
const lesotho = {
	keywords: [
		'ls',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇱🇸',
	fitzpatrick_scale: false,
	category: 'flags',
};
const liberia = {
	keywords: [
		'lr',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇱🇷',
	fitzpatrick_scale: false,
	category: 'flags',
};
const libya = {
	keywords: [
		'ly',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇱🇾',
	fitzpatrick_scale: false,
	category: 'flags',
};
const liechtenstein = {
	keywords: [
		'li',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇱🇮',
	fitzpatrick_scale: false,
	category: 'flags',
};
const lithuania = {
	keywords: [
		'lt',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇱🇹',
	fitzpatrick_scale: false,
	category: 'flags',
};
const luxembourg = {
	keywords: [
		'lu',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇱🇺',
	fitzpatrick_scale: false,
	category: 'flags',
};
const macau = {
	keywords: [
		'macao',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇲🇴',
	fitzpatrick_scale: false,
	category: 'flags',
};
const macedonia = {
	keywords: [
		'macedonia,',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇲🇰',
	fitzpatrick_scale: false,
	category: 'flags',
};
const madagascar = {
	keywords: [
		'mg',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇲🇬',
	fitzpatrick_scale: false,
	category: 'flags',
};
const malawi = {
	keywords: [
		'mw',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇲🇼',
	fitzpatrick_scale: false,
	category: 'flags',
};
const malaysia = {
	keywords: [
		'my',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇲🇾',
	fitzpatrick_scale: false,
	category: 'flags',
};
const maldives = {
	keywords: [
		'mv',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇲🇻',
	fitzpatrick_scale: false,
	category: 'flags',
};
const mali = {
	keywords: [
		'ml',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇲🇱',
	fitzpatrick_scale: false,
	category: 'flags',
};
const malta = {
	keywords: [
		'mt',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇲🇹',
	fitzpatrick_scale: false,
	category: 'flags',
};
const marshall_islands = {
	keywords: [
		'marshall',
		'islands',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇲🇭',
	fitzpatrick_scale: false,
	category: 'flags',
};
const martinique = {
	keywords: [
		'mq',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇲🇶',
	fitzpatrick_scale: false,
	category: 'flags',
};
const mauritania = {
	keywords: [
		'mr',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇲🇷',
	fitzpatrick_scale: false,
	category: 'flags',
};
const mauritius = {
	keywords: [
		'mu',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇲🇺',
	fitzpatrick_scale: false,
	category: 'flags',
};
const mayotte = {
	keywords: [
		'yt',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇾🇹',
	fitzpatrick_scale: false,
	category: 'flags',
};
const mexico = {
	keywords: [
		'mx',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇲🇽',
	fitzpatrick_scale: false,
	category: 'flags',
};
const micronesia = {
	keywords: [
		'micronesia,',
		'federated',
		'states',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇫🇲',
	fitzpatrick_scale: false,
	category: 'flags',
};
const moldova = {
	keywords: [
		'moldova,',
		'republic',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇲🇩',
	fitzpatrick_scale: false,
	category: 'flags',
};
const monaco = {
	keywords: [
		'mc',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇲🇨',
	fitzpatrick_scale: false,
	category: 'flags',
};
const mongolia = {
	keywords: [
		'mn',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇲🇳',
	fitzpatrick_scale: false,
	category: 'flags',
};
const montenegro = {
	keywords: [
		'me',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇲🇪',
	fitzpatrick_scale: false,
	category: 'flags',
};
const montserrat = {
	keywords: [
		'ms',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇲🇸',
	fitzpatrick_scale: false,
	category: 'flags',
};
const morocco = {
	keywords: [
		'ma',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇲🇦',
	fitzpatrick_scale: false,
	category: 'flags',
};
const mozambique = {
	keywords: [
		'mz',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇲🇿',
	fitzpatrick_scale: false,
	category: 'flags',
};
const myanmar = {
	keywords: [
		'mm',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇲🇲',
	fitzpatrick_scale: false,
	category: 'flags',
};
const namibia = {
	keywords: [
		'na',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇳🇦',
	fitzpatrick_scale: false,
	category: 'flags',
};
const nauru = {
	keywords: [
		'nr',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇳🇷',
	fitzpatrick_scale: false,
	category: 'flags',
};
const nepal = {
	keywords: [
		'np',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇳🇵',
	fitzpatrick_scale: false,
	category: 'flags',
};
const netherlands = {
	keywords: [
		'nl',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇳🇱',
	fitzpatrick_scale: false,
	category: 'flags',
};
const new_caledonia = {
	keywords: [
		'new',
		'caledonia',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇳🇨',
	fitzpatrick_scale: false,
	category: 'flags',
};
const new_zealand = {
	keywords: [
		'new',
		'zealand',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇳🇿',
	fitzpatrick_scale: false,
	category: 'flags',
};
const nicaragua = {
	keywords: [
		'ni',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇳🇮',
	fitzpatrick_scale: false,
	category: 'flags',
};
const niger = {
	keywords: [
		'ne',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇳🇪',
	fitzpatrick_scale: false,
	category: 'flags',
};
const nigeria = {
	keywords: [
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇳🇬',
	fitzpatrick_scale: false,
	category: 'flags',
};
const niue = {
	keywords: [
		'nu',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇳🇺',
	fitzpatrick_scale: false,
	category: 'flags',
};
const norfolk_island = {
	keywords: [
		'norfolk',
		'island',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇳🇫',
	fitzpatrick_scale: false,
	category: 'flags',
};
const northern_mariana_islands = {
	keywords: [
		'northern',
		'mariana',
		'islands',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇲🇵',
	fitzpatrick_scale: false,
	category: 'flags',
};
const north_korea = {
	keywords: [
		'north',
		'korea',
		'nation',
		'flag',
		'country',
		'banner',
	],
	char: '🇰🇵',
	fitzpatrick_scale: false,
	category: 'flags',
};
const norway = {
	keywords: [
		'no',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇳🇴',
	fitzpatrick_scale: false,
	category: 'flags',
};
const oman = {
	keywords: [
		'om_symbol',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇴🇲',
	fitzpatrick_scale: false,
	category: 'flags',
};
const pakistan = {
	keywords: [
		'pk',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇵🇰',
	fitzpatrick_scale: false,
	category: 'flags',
};
const palau = {
	keywords: [
		'pw',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇵🇼',
	fitzpatrick_scale: false,
	category: 'flags',
};
const palestinian_territories = {
	keywords: [
		'palestine',
		'palestinian',
		'territories',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇵🇸',
	fitzpatrick_scale: false,
	category: 'flags',
};
const panama = {
	keywords: [
		'pa',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇵🇦',
	fitzpatrick_scale: false,
	category: 'flags',
};
const papua_new_guinea = {
	keywords: [
		'papua',
		'new',
		'guinea',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇵🇬',
	fitzpatrick_scale: false,
	category: 'flags',
};
const paraguay = {
	keywords: [
		'py',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇵🇾',
	fitzpatrick_scale: false,
	category: 'flags',
};
const peru = {
	keywords: [
		'pe',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇵🇪',
	fitzpatrick_scale: false,
	category: 'flags',
};
const philippines = {
	keywords: [
		'ph',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇵🇭',
	fitzpatrick_scale: false,
	category: 'flags',
};
const pitcairn_islands = {
	keywords: [
		'pitcairn',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇵🇳',
	fitzpatrick_scale: false,
	category: 'flags',
};
const poland = {
	keywords: [
		'pl',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇵🇱',
	fitzpatrick_scale: false,
	category: 'flags',
};
const portugal = {
	keywords: [
		'pt',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇵🇹',
	fitzpatrick_scale: false,
	category: 'flags',
};
const puerto_rico = {
	keywords: [
		'puerto',
		'rico',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇵🇷',
	fitzpatrick_scale: false,
	category: 'flags',
};
const qatar = {
	keywords: [
		'qa',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇶🇦',
	fitzpatrick_scale: false,
	category: 'flags',
};
const reunion = {
	keywords: [
		'réunion',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇷🇪',
	fitzpatrick_scale: false,
	category: 'flags',
};
const romania = {
	keywords: [
		'ro',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇷🇴',
	fitzpatrick_scale: false,
	category: 'flags',
};
const ru = {
	keywords: [
		'russian',
		'federation',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇷🇺',
	fitzpatrick_scale: false,
	category: 'flags',
};
const rwanda = {
	keywords: [
		'rw',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇷🇼',
	fitzpatrick_scale: false,
	category: 'flags',
};
const st_barthelemy = {
	keywords: [
		'saint',
		'barthélemy',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇧🇱',
	fitzpatrick_scale: false,
	category: 'flags',
};
const st_helena = {
	keywords: [
		'saint',
		'helena',
		'ascension',
		'tristan',
		'cunha',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇸🇭',
	fitzpatrick_scale: false,
	category: 'flags',
};
const st_kitts_nevis = {
	keywords: [
		'saint',
		'kitts',
		'nevis',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇰🇳',
	fitzpatrick_scale: false,
	category: 'flags',
};
const st_lucia = {
	keywords: [
		'saint',
		'lucia',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇱🇨',
	fitzpatrick_scale: false,
	category: 'flags',
};
const st_pierre_miquelon = {
	keywords: [
		'saint',
		'pierre',
		'miquelon',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇵🇲',
	fitzpatrick_scale: false,
	category: 'flags',
};
const st_vincent_grenadines = {
	keywords: [
		'saint',
		'vincent',
		'grenadines',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇻🇨',
	fitzpatrick_scale: false,
	category: 'flags',
};
const samoa = {
	keywords: [
		'ws',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇼🇸',
	fitzpatrick_scale: false,
	category: 'flags',
};
const san_marino = {
	keywords: [
		'san',
		'marino',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇸🇲',
	fitzpatrick_scale: false,
	category: 'flags',
};
const sao_tome_principe = {
	keywords: [
		'sao',
		'tome',
		'principe',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇸🇹',
	fitzpatrick_scale: false,
	category: 'flags',
};
const saudi_arabia = {
	keywords: [
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇸🇦',
	fitzpatrick_scale: false,
	category: 'flags',
};
const senegal = {
	keywords: [
		'sn',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇸🇳',
	fitzpatrick_scale: false,
	category: 'flags',
};
const serbia = {
	keywords: [
		'rs',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇷🇸',
	fitzpatrick_scale: false,
	category: 'flags',
};
const seychelles = {
	keywords: [
		'sc',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇸🇨',
	fitzpatrick_scale: false,
	category: 'flags',
};
const sierra_leone = {
	keywords: [
		'sierra',
		'leone',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇸🇱',
	fitzpatrick_scale: false,
	category: 'flags',
};
const singapore = {
	keywords: [
		'sg',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇸🇬',
	fitzpatrick_scale: false,
	category: 'flags',
};
const sint_maarten = {
	keywords: [
		'sint',
		'maarten',
		'dutch',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇸🇽',
	fitzpatrick_scale: false,
	category: 'flags',
};
const slovakia = {
	keywords: [
		'sk',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇸🇰',
	fitzpatrick_scale: false,
	category: 'flags',
};
const slovenia = {
	keywords: [
		'si',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇸🇮',
	fitzpatrick_scale: false,
	category: 'flags',
};
const solomon_islands = {
	keywords: [
		'solomon',
		'islands',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇸🇧',
	fitzpatrick_scale: false,
	category: 'flags',
};
const somalia = {
	keywords: [
		'so',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇸🇴',
	fitzpatrick_scale: false,
	category: 'flags',
};
const south_africa = {
	keywords: [
		'south',
		'africa',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇿🇦',
	fitzpatrick_scale: false,
	category: 'flags',
};
const south_georgia_south_sandwich_islands = {
	keywords: [
		'south',
		'georgia',
		'sandwich',
		'islands',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇬🇸',
	fitzpatrick_scale: false,
	category: 'flags',
};
const kr = {
	keywords: [
		'south',
		'korea',
		'nation',
		'flag',
		'country',
		'banner',
	],
	char: '🇰🇷',
	fitzpatrick_scale: false,
	category: 'flags',
};
const south_sudan = {
	keywords: [
		'south',
		'sd',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇸🇸',
	fitzpatrick_scale: false,
	category: 'flags',
};
const es = {
	keywords: [
		'spain',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇪🇸',
	fitzpatrick_scale: false,
	category: 'flags',
};
const sri_lanka = {
	keywords: [
		'sri',
		'lanka',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇱🇰',
	fitzpatrick_scale: false,
	category: 'flags',
};
const sudan = {
	keywords: [
		'sd',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇸🇩',
	fitzpatrick_scale: false,
	category: 'flags',
};
const suriname = {
	keywords: [
		'sr',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇸🇷',
	fitzpatrick_scale: false,
	category: 'flags',
};
const swaziland = {
	keywords: [
		'sz',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇸🇿',
	fitzpatrick_scale: false,
	category: 'flags',
};
const sweden = {
	keywords: [
		'se',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇸🇪',
	fitzpatrick_scale: false,
	category: 'flags',
};
const switzerland = {
	keywords: [
		'ch',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇨🇭',
	fitzpatrick_scale: false,
	category: 'flags',
};
const syria = {
	keywords: [
		'syrian',
		'arab',
		'republic',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇸🇾',
	fitzpatrick_scale: false,
	category: 'flags',
};
const taiwan = {
	keywords: [
		'tw',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇹🇼',
	fitzpatrick_scale: false,
	category: 'flags',
};
const tajikistan = {
	keywords: [
		'tj',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇹🇯',
	fitzpatrick_scale: false,
	category: 'flags',
};
const tanzania = {
	keywords: [
		'tanzania,',
		'united',
		'republic',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇹🇿',
	fitzpatrick_scale: false,
	category: 'flags',
};
const thailand = {
	keywords: [
		'th',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇹🇭',
	fitzpatrick_scale: false,
	category: 'flags',
};
const timor_leste = {
	keywords: [
		'timor',
		'leste',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇹🇱',
	fitzpatrick_scale: false,
	category: 'flags',
};
const togo = {
	keywords: [
		'tg',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇹🇬',
	fitzpatrick_scale: false,
	category: 'flags',
};
const tokelau = {
	keywords: [
		'tk',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇹🇰',
	fitzpatrick_scale: false,
	category: 'flags',
};
const tonga = {
	keywords: [
		'to',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇹🇴',
	fitzpatrick_scale: false,
	category: 'flags',
};
const trinidad_tobago = {
	keywords: [
		'trinidad',
		'tobago',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇹🇹',
	fitzpatrick_scale: false,
	category: 'flags',
};
const tunisia = {
	keywords: [
		'tn',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇹🇳',
	fitzpatrick_scale: false,
	category: 'flags',
};
const tr = {
	keywords: [
		'turkey',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇹🇷',
	fitzpatrick_scale: false,
	category: 'flags',
};
const turkmenistan = {
	keywords: [
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇹🇲',
	fitzpatrick_scale: false,
	category: 'flags',
};
const turks_caicos_islands = {
	keywords: [
		'turks',
		'caicos',
		'islands',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇹🇨',
	fitzpatrick_scale: false,
	category: 'flags',
};
const tuvalu = {
	keywords: [
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇹🇻',
	fitzpatrick_scale: false,
	category: 'flags',
};
const uganda = {
	keywords: [
		'ug',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇺🇬',
	fitzpatrick_scale: false,
	category: 'flags',
};
const ukraine = {
	keywords: [
		'ua',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇺🇦',
	fitzpatrick_scale: false,
	category: 'flags',
};
const united_arab_emirates = {
	keywords: [
		'united',
		'arab',
		'emirates',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇦🇪',
	fitzpatrick_scale: false,
	category: 'flags',
};
const uk = {
	keywords: [
		'united',
		'kingdom',
		'great',
		'britain',
		'northern',
		'ireland',
		'flag',
		'nation',
		'country',
		'banner',
		'british',
		'UK',
		'english',
		'england',
		'union jack',
	],
	char: '🇬🇧',
	fitzpatrick_scale: false,
	category: 'flags',
};
const england = {
	keywords: [
		'flag',
		'english',
	],
	char: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
	fitzpatrick_scale: false,
	category: 'flags',
};
const scotland = {
	keywords: [
		'flag',
		'scottish',
	],
	char: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
	fitzpatrick_scale: false,
	category: 'flags',
};
const wales = {
	keywords: [
		'flag',
		'welsh',
	],
	char: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
	fitzpatrick_scale: false,
	category: 'flags',
};
const us = {
	keywords: [
		'united',
		'states',
		'america',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇺🇸',
	fitzpatrick_scale: false,
	category: 'flags',
};
const us_virgin_islands = {
	keywords: [
		'virgin',
		'islands',
		'us',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇻🇮',
	fitzpatrick_scale: false,
	category: 'flags',
};
const uruguay = {
	keywords: [
		'uy',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇺🇾',
	fitzpatrick_scale: false,
	category: 'flags',
};
const uzbekistan = {
	keywords: [
		'uz',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇺🇿',
	fitzpatrick_scale: false,
	category: 'flags',
};
const vanuatu = {
	keywords: [
		'vu',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇻🇺',
	fitzpatrick_scale: false,
	category: 'flags',
};
const vatican_city = {
	keywords: [
		'vatican',
		'city',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇻🇦',
	fitzpatrick_scale: false,
	category: 'flags',
};
const venezuela = {
	keywords: [
		've',
		'bolivarian',
		'republic',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇻🇪',
	fitzpatrick_scale: false,
	category: 'flags',
};
const vietnam = {
	keywords: [
		'viet',
		'nam',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇻🇳',
	fitzpatrick_scale: false,
	category: 'flags',
};
const wallis_futuna = {
	keywords: [
		'wallis',
		'futuna',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇼🇫',
	fitzpatrick_scale: false,
	category: 'flags',
};
const western_sahara = {
	keywords: [
		'western',
		'sahara',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇪🇭',
	fitzpatrick_scale: false,
	category: 'flags',
};
const yemen = {
	keywords: [
		'ye',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇾🇪',
	fitzpatrick_scale: false,
	category: 'flags',
};
const zambia = {
	keywords: [
		'zm',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇿🇲',
	fitzpatrick_scale: false,
	category: 'flags',
};
const zimbabwe = {
	keywords: [
		'zw',
		'flag',
		'nation',
		'country',
		'banner',
	],
	char: '🇿🇼',
	fitzpatrick_scale: false,
	category: 'flags',
};
const united_nations = {
	keywords: [
		'un',
		'flag',
		'banner',
	],
	char: '🇺🇳',
	fitzpatrick_scale: false,
	category: 'flags',
};
const pirate_flag = {
	keywords: [
		'skull',
		'crossbones',
		'flag',
		'banner',
	],
	char: '🏴‍☠️',
	fitzpatrick_scale: false,
	category: 'flags',
};
const require$$0 = {
	'100': {
		keywords: [
			'score',
			'perfect',
			'numbers',
			'century',
			'exam',
			'quiz',
			'test',
			'pass',
			'hundred',
		],
		char: '💯',
		fitzpatrick_scale: false,
		category: 'symbols',
	},
	'1234': {
		keywords: [
			'numbers',
			'blue-square',
		],
		char: '🔢',
		fitzpatrick_scale: false,
		category: 'symbols',
	},
	grinning: grinning,
	grimacing: grimacing,
	grin: grin,
	joy: joy,
	rofl: rofl,
	partying: partying,
	smiley: smiley,
	smile: smile,
	sweat_smile: sweat_smile,
	laughing: laughing,
	innocent: innocent,
	wink: wink,
	blush: blush,
	slightly_smiling_face: slightly_smiling_face,
	upside_down_face: upside_down_face,
	relaxed: relaxed,
	yum: yum,
	relieved: relieved,
	heart_eyes: heart_eyes,
	smiling_face_with_three_hearts: smiling_face_with_three_hearts,
	kissing_heart: kissing_heart,
	kissing: kissing,
	kissing_smiling_eyes: kissing_smiling_eyes,
	kissing_closed_eyes: kissing_closed_eyes,
	stuck_out_tongue_winking_eye: stuck_out_tongue_winking_eye,
	zany: zany,
	raised_eyebrow: raised_eyebrow,
	monocle: monocle,
	stuck_out_tongue_closed_eyes: stuck_out_tongue_closed_eyes,
	stuck_out_tongue: stuck_out_tongue,
	money_mouth_face: money_mouth_face,
	nerd_face: nerd_face,
	sunglasses: sunglasses,
	star_struck: star_struck,
	clown_face: clown_face,
	cowboy_hat_face: cowboy_hat_face,
	hugs: hugs,
	smirk: smirk,
	no_mouth: no_mouth,
	neutral_face: neutral_face,
	expressionless: expressionless,
	unamused: unamused,
	roll_eyes: roll_eyes,
	thinking: thinking,
	lying_face: lying_face,
	hand_over_mouth: hand_over_mouth,
	shushing: shushing,
	symbols_over_mouth: symbols_over_mouth,
	exploding_head: exploding_head,
	flushed: flushed,
	disappointed: disappointed,
	worried: worried,
	angry: angry,
	rage: rage,
	pensive: pensive,
	confused: confused,
	slightly_frowning_face: slightly_frowning_face,
	frowning_face: frowning_face,
	persevere: persevere,
	confounded: confounded,
	tired_face: tired_face,
	weary: weary,
	pleading: pleading,
	triumph: triumph,
	open_mouth: open_mouth,
	scream: scream,
	fearful: fearful,
	cold_sweat: cold_sweat,
	hushed: hushed,
	frowning: frowning,
	anguished: anguished,
	cry: cry,
	disappointed_relieved: disappointed_relieved,
	drooling_face: drooling_face,
	sleepy: sleepy,
	sweat: sweat,
	hot: hot,
	cold: cold,
	sob: sob,
	dizzy_face: dizzy_face,
	astonished: astonished,
	zipper_mouth_face: zipper_mouth_face,
	nauseated_face: nauseated_face,
	sneezing_face: sneezing_face,
	vomiting: vomiting,
	mask: mask,
	face_with_thermometer: face_with_thermometer,
	face_with_head_bandage: face_with_head_bandage,
	woozy: woozy,
	sleeping: sleeping,
	zzz: zzz,
	poop: poop,
	smiling_imp: smiling_imp,
	imp: imp,
	japanese_ogre: japanese_ogre,
	japanese_goblin: japanese_goblin,
	skull: skull,
	ghost: ghost,
	alien: alien,
	robot: robot,
	smiley_cat: smiley_cat,
	smile_cat: smile_cat,
	joy_cat: joy_cat,
	heart_eyes_cat: heart_eyes_cat,
	smirk_cat: smirk_cat,
	kissing_cat: kissing_cat,
	scream_cat: scream_cat,
	crying_cat_face: crying_cat_face,
	pouting_cat: pouting_cat,
	palms_up: palms_up,
	raised_hands: raised_hands,
	clap: clap,
	wave: wave,
	call_me_hand: call_me_hand,
	'+1': {
		keywords: [
			'thumbsup',
			'yes',
			'awesome',
			'good',
			'agree',
			'accept',
			'cool',
			'hand',
			'like',
		],
		char: '👍',
		fitzpatrick_scale: true,
		category: 'people',
	},
	'-1': {
		keywords: [
			'thumbsdown',
			'no',
			'dislike',
			'hand',
		],
		char: '👎',
		fitzpatrick_scale: true,
		category: 'people',
	},
	facepunch: facepunch,
	fist: fist,
	fist_left: fist_left,
	fist_right: fist_right,
	v: v,
	ok_hand: ok_hand,
	raised_hand: raised_hand,
	raised_back_of_hand: raised_back_of_hand,
	open_hands: open_hands,
	muscle: muscle,
	pray: pray,
	foot: foot,
	leg: leg,
	handshake: handshake,
	point_up: point_up,
	point_up_2: point_up_2,
	point_down: point_down,
	point_left: point_left,
	point_right: point_right,
	fu: fu,
	raised_hand_with_fingers_splayed: raised_hand_with_fingers_splayed,
	love_you: love_you,
	metal: metal,
	crossed_fingers: crossed_fingers,
	vulcan_salute: vulcan_salute,
	writing_hand: writing_hand,
	selfie: selfie,
	nail_care: nail_care,
	lips: lips,
	tooth: tooth,
	tongue: tongue,
	ear: ear,
	nose: nose,
	eye: eye,
	eyes: eyes,
	brain: brain,
	bust_in_silhouette: bust_in_silhouette,
	busts_in_silhouette: busts_in_silhouette,
	speaking_head: speaking_head,
	baby: baby,
	child: child,
	boy: boy,
	girl: girl,
	adult: adult,
	man: man,
	woman: woman,
	blonde_woman: blonde_woman,
	blonde_man: blonde_man,
	bearded_person: bearded_person,
	older_adult: older_adult,
	older_man: older_man,
	older_woman: older_woman,
	man_with_gua_pi_mao: man_with_gua_pi_mao,
	woman_with_headscarf: woman_with_headscarf,
	woman_with_turban: woman_with_turban,
	man_with_turban: man_with_turban,
	policewoman: policewoman,
	policeman: policeman,
	construction_worker_woman: construction_worker_woman,
	construction_worker_man: construction_worker_man,
	guardswoman: guardswoman,
	guardsman: guardsman,
	female_detective: female_detective,
	male_detective: male_detective,
	woman_health_worker: woman_health_worker,
	man_health_worker: man_health_worker,
	woman_farmer: woman_farmer,
	man_farmer: man_farmer,
	woman_cook: woman_cook,
	man_cook: man_cook,
	woman_student: woman_student,
	man_student: man_student,
	woman_singer: woman_singer,
	man_singer: man_singer,
	woman_teacher: woman_teacher,
	man_teacher: man_teacher,
	woman_factory_worker: woman_factory_worker,
	man_factory_worker: man_factory_worker,
	woman_technologist: woman_technologist,
	man_technologist: man_technologist,
	woman_office_worker: woman_office_worker,
	man_office_worker: man_office_worker,
	woman_mechanic: woman_mechanic,
	man_mechanic: man_mechanic,
	woman_scientist: woman_scientist,
	man_scientist: man_scientist,
	woman_artist: woman_artist,
	man_artist: man_artist,
	woman_firefighter: woman_firefighter,
	man_firefighter: man_firefighter,
	woman_pilot: woman_pilot,
	man_pilot: man_pilot,
	woman_astronaut: woman_astronaut,
	man_astronaut: man_astronaut,
	woman_judge: woman_judge,
	man_judge: man_judge,
	woman_superhero: woman_superhero,
	man_superhero: man_superhero,
	woman_supervillain: woman_supervillain,
	man_supervillain: man_supervillain,
	mrs_claus: mrs_claus,
	santa: santa,
	sorceress: sorceress,
	wizard: wizard,
	woman_elf: woman_elf,
	man_elf: man_elf,
	woman_vampire: woman_vampire,
	man_vampire: man_vampire,
	woman_zombie: woman_zombie,
	man_zombie: man_zombie,
	woman_genie: woman_genie,
	man_genie: man_genie,
	mermaid: mermaid,
	merman: merman,
	woman_fairy: woman_fairy,
	man_fairy: man_fairy,
	angel: angel,
	pregnant_woman: pregnant_woman,
	breastfeeding: breastfeeding,
	princess: princess,
	prince: prince,
	bride_with_veil: bride_with_veil,
	man_in_tuxedo: man_in_tuxedo,
	running_woman: running_woman,
	running_man: running_man,
	walking_woman: walking_woman,
	walking_man: walking_man,
	dancer: dancer,
	man_dancing: man_dancing,
	dancing_women: dancing_women,
	dancing_men: dancing_men,
	couple: couple,
	two_men_holding_hands: two_men_holding_hands,
	two_women_holding_hands: two_women_holding_hands,
	bowing_woman: bowing_woman,
	bowing_man: bowing_man,
	man_facepalming: man_facepalming,
	woman_facepalming: woman_facepalming,
	woman_shrugging: woman_shrugging,
	man_shrugging: man_shrugging,
	tipping_hand_woman: tipping_hand_woman,
	tipping_hand_man: tipping_hand_man,
	no_good_woman: no_good_woman,
	no_good_man: no_good_man,
	ok_woman: ok_woman,
	ok_man: ok_man,
	raising_hand_woman: raising_hand_woman,
	raising_hand_man: raising_hand_man,
	pouting_woman: pouting_woman,
	pouting_man: pouting_man,
	frowning_woman: frowning_woman,
	frowning_man: frowning_man,
	haircut_woman: haircut_woman,
	haircut_man: haircut_man,
	massage_woman: massage_woman,
	massage_man: massage_man,
	woman_in_steamy_room: woman_in_steamy_room,
	man_in_steamy_room: man_in_steamy_room,
	couple_with_heart_woman_man: couple_with_heart_woman_man,
	couple_with_heart_woman_woman: couple_with_heart_woman_woman,
	couple_with_heart_man_man: couple_with_heart_man_man,
	couplekiss_man_woman: couplekiss_man_woman,
	couplekiss_woman_woman: couplekiss_woman_woman,
	couplekiss_man_man: couplekiss_man_man,
	family_man_woman_boy: family_man_woman_boy,
	family_man_woman_girl: family_man_woman_girl,
	family_man_woman_girl_boy: family_man_woman_girl_boy,
	family_man_woman_boy_boy: family_man_woman_boy_boy,
	family_man_woman_girl_girl: family_man_woman_girl_girl,
	family_woman_woman_boy: family_woman_woman_boy,
	family_woman_woman_girl: family_woman_woman_girl,
	family_woman_woman_girl_boy: family_woman_woman_girl_boy,
	family_woman_woman_boy_boy: family_woman_woman_boy_boy,
	family_woman_woman_girl_girl: family_woman_woman_girl_girl,
	family_man_man_boy: family_man_man_boy,
	family_man_man_girl: family_man_man_girl,
	family_man_man_girl_boy: family_man_man_girl_boy,
	family_man_man_boy_boy: family_man_man_boy_boy,
	family_man_man_girl_girl: family_man_man_girl_girl,
	family_woman_boy: family_woman_boy,
	family_woman_girl: family_woman_girl,
	family_woman_girl_boy: family_woman_girl_boy,
	family_woman_boy_boy: family_woman_boy_boy,
	family_woman_girl_girl: family_woman_girl_girl,
	family_man_boy: family_man_boy,
	family_man_girl: family_man_girl,
	family_man_girl_boy: family_man_girl_boy,
	family_man_boy_boy: family_man_boy_boy,
	family_man_girl_girl: family_man_girl_girl,
	yarn: yarn,
	thread: thread,
	coat: coat,
	labcoat: labcoat,
	womans_clothes: womans_clothes,
	tshirt: tshirt,
	jeans: jeans,
	necktie: necktie,
	dress: dress,
	bikini: bikini,
	kimono: kimono,
	lipstick: lipstick,
	kiss: kiss,
	footprints: footprints,
	flat_shoe: flat_shoe,
	high_heel: high_heel,
	sandal: sandal,
	boot: boot,
	mans_shoe: mans_shoe,
	athletic_shoe: athletic_shoe,
	hiking_boot: hiking_boot,
	socks: socks,
	gloves: gloves,
	scarf: scarf,
	womans_hat: womans_hat,
	tophat: tophat,
	billed_hat: billed_hat,
	rescue_worker_helmet: rescue_worker_helmet,
	mortar_board: mortar_board,
	crown: crown,
	school_satchel: school_satchel,
	luggage: luggage,
	pouch: pouch,
	purse: purse,
	handbag: handbag,
	briefcase: briefcase,
	eyeglasses: eyeglasses,
	dark_sunglasses: dark_sunglasses,
	goggles: goggles,
	ring: ring,
	closed_umbrella: closed_umbrella,
	dog: dog,
	cat: cat,
	mouse: mouse,
	hamster: hamster,
	rabbit: rabbit,
	fox_face: fox_face,
	bear: bear,
	panda_face: panda_face,
	koala: koala,
	tiger: tiger,
	lion: lion,
	cow: cow,
	pig: pig,
	pig_nose: pig_nose,
	frog: frog,
	squid: squid,
	octopus: octopus,
	shrimp: shrimp,
	monkey_face: monkey_face,
	gorilla: gorilla,
	see_no_evil: see_no_evil,
	hear_no_evil: hear_no_evil,
	speak_no_evil: speak_no_evil,
	monkey: monkey,
	chicken: chicken,
	penguin: penguin,
	bird: bird,
	baby_chick: baby_chick,
	hatching_chick: hatching_chick,
	hatched_chick: hatched_chick,
	duck: duck,
	eagle: eagle,
	owl: owl,
	bat: bat,
	wolf: wolf,
	boar: boar,
	horse: horse,
	unicorn: unicorn,
	honeybee: honeybee,
	bug: bug,
	butterfly: butterfly,
	snail: snail,
	beetle: beetle,
	ant: ant,
	grasshopper: grasshopper,
	spider: spider,
	scorpion: scorpion,
	crab: crab,
	snake: snake,
	lizard: lizard,
	't-rex': {
		keywords: [
			'animal',
			'nature',
			'dinosaur',
			'tyrannosaurus',
			'extinct',
		],
		char: '🦖',
		fitzpatrick_scale: false,
		category: 'animals_and_nature',
	},
	sauropod: sauropod,
	turtle: turtle,
	tropical_fish: tropical_fish,
	fish: fish,
	blowfish: blowfish,
	dolphin: dolphin,
	shark: shark,
	whale: whale,
	whale2: whale2,
	crocodile: crocodile,
	leopard: leopard,
	zebra: zebra,
	tiger2: tiger2,
	water_buffalo: water_buffalo,
	ox: ox,
	cow2: cow2,
	deer: deer,
	dromedary_camel: dromedary_camel,
	camel: camel,
	giraffe: giraffe,
	elephant: elephant,
	rhinoceros: rhinoceros,
	goat: goat,
	ram: ram,
	sheep: sheep,
	racehorse: racehorse,
	pig2: pig2,
	rat: rat,
	mouse2: mouse2,
	rooster: rooster,
	turkey: turkey,
	dove: dove,
	dog2: dog2,
	poodle: poodle,
	cat2: cat2,
	rabbit2: rabbit2,
	chipmunk: chipmunk,
	hedgehog: hedgehog,
	raccoon: raccoon,
	llama: llama,
	hippopotamus: hippopotamus,
	kangaroo: kangaroo,
	badger: badger,
	swan: swan,
	peacock: peacock,
	parrot: parrot,
	lobster: lobster,
	mosquito: mosquito,
	paw_prints: paw_prints,
	dragon: dragon,
	dragon_face: dragon_face,
	cactus: cactus,
	christmas_tree: christmas_tree,
	evergreen_tree: evergreen_tree,
	deciduous_tree: deciduous_tree,
	palm_tree: palm_tree,
	seedling: seedling,
	herb: herb,
	shamrock: shamrock,
	four_leaf_clover: four_leaf_clover,
	bamboo: bamboo,
	tanabata_tree: tanabata_tree,
	leaves: leaves,
	fallen_leaf: fallen_leaf,
	maple_leaf: maple_leaf,
	ear_of_rice: ear_of_rice,
	hibiscus: hibiscus,
	sunflower: sunflower,
	rose: rose,
	wilted_flower: wilted_flower,
	tulip: tulip,
	blossom: blossom,
	cherry_blossom: cherry_blossom,
	bouquet: bouquet,
	mushroom: mushroom,
	chestnut: chestnut,
	jack_o_lantern: jack_o_lantern,
	shell: shell,
	spider_web: spider_web,
	earth_americas: earth_americas,
	earth_africa: earth_africa,
	earth_asia: earth_asia,
	full_moon: full_moon,
	waning_gibbous_moon: waning_gibbous_moon,
	last_quarter_moon: last_quarter_moon,
	waning_crescent_moon: waning_crescent_moon,
	new_moon: new_moon,
	waxing_crescent_moon: waxing_crescent_moon,
	first_quarter_moon: first_quarter_moon,
	waxing_gibbous_moon: waxing_gibbous_moon,
	new_moon_with_face: new_moon_with_face,
	full_moon_with_face: full_moon_with_face,
	first_quarter_moon_with_face: first_quarter_moon_with_face,
	last_quarter_moon_with_face: last_quarter_moon_with_face,
	sun_with_face: sun_with_face,
	crescent_moon: crescent_moon,
	star: star,
	star2: star2,
	dizzy: dizzy,
	sparkles: sparkles,
	comet: comet,
	sunny: sunny,
	sun_behind_small_cloud: sun_behind_small_cloud,
	partly_sunny: partly_sunny,
	sun_behind_large_cloud: sun_behind_large_cloud,
	sun_behind_rain_cloud: sun_behind_rain_cloud,
	cloud: cloud,
	cloud_with_rain: cloud_with_rain,
	cloud_with_lightning_and_rain: cloud_with_lightning_and_rain,
	cloud_with_lightning: cloud_with_lightning,
	zap: zap,
	fire: fire,
	boom: boom,
	snowflake: snowflake,
	cloud_with_snow: cloud_with_snow,
	snowman: snowman,
	snowman_with_snow: snowman_with_snow,
	wind_face: wind_face,
	dash: dash,
	tornado: tornado,
	fog: fog,
	open_umbrella: open_umbrella,
	umbrella: umbrella,
	droplet: droplet,
	sweat_drops: sweat_drops,
	ocean: ocean,
	green_apple: green_apple,
	apple: apple,
	pear: pear,
	tangerine: tangerine,
	lemon: lemon,
	banana: banana,
	watermelon: watermelon,
	grapes: grapes,
	strawberry: strawberry,
	melon: melon,
	cherries: cherries,
	peach: peach,
	pineapple: pineapple,
	coconut: coconut,
	kiwi_fruit: kiwi_fruit,
	mango: mango,
	avocado: avocado,
	broccoli: broccoli,
	tomato: tomato,
	eggplant: eggplant,
	cucumber: cucumber,
	carrot: carrot,
	hot_pepper: hot_pepper,
	potato: potato,
	corn: corn,
	leafy_greens: leafy_greens,
	sweet_potato: sweet_potato,
	peanuts: peanuts,
	honey_pot: honey_pot,
	croissant: croissant,
	bread: bread,
	baguette_bread: baguette_bread,
	bagel: bagel,
	pretzel: pretzel,
	cheese: cheese,
	egg: egg,
	bacon: bacon,
	steak: steak,
	pancakes: pancakes,
	poultry_leg: poultry_leg,
	meat_on_bone: meat_on_bone,
	bone: bone,
	fried_shrimp: fried_shrimp,
	fried_egg: fried_egg,
	hamburger: hamburger,
	fries: fries,
	stuffed_flatbread: stuffed_flatbread,
	hotdog: hotdog,
	pizza: pizza,
	sandwich: sandwich,
	canned_food: canned_food,
	spaghetti: spaghetti,
	taco: taco,
	burrito: burrito,
	green_salad: green_salad,
	shallow_pan_of_food: shallow_pan_of_food,
	ramen: ramen,
	stew: stew,
	fish_cake: fish_cake,
	fortune_cookie: fortune_cookie,
	sushi: sushi,
	bento: bento,
	curry: curry,
	rice_ball: rice_ball,
	rice: rice,
	rice_cracker: rice_cracker,
	oden: oden,
	dango: dango,
	shaved_ice: shaved_ice,
	ice_cream: ice_cream,
	icecream: icecream,
	pie: pie,
	cake: cake,
	cupcake: cupcake,
	moon_cake: moon_cake,
	birthday: birthday,
	custard: custard,
	candy: candy,
	lollipop: lollipop,
	chocolate_bar: chocolate_bar,
	popcorn: popcorn,
	dumpling: dumpling,
	doughnut: doughnut,
	cookie: cookie,
	milk_glass: milk_glass,
	beer: beer,
	beers: beers,
	clinking_glasses: clinking_glasses,
	wine_glass: wine_glass,
	tumbler_glass: tumbler_glass,
	cocktail: cocktail,
	tropical_drink: tropical_drink,
	champagne: champagne,
	sake: sake,
	tea: tea,
	cup_with_straw: cup_with_straw,
	coffee: coffee,
	baby_bottle: baby_bottle,
	salt: salt,
	spoon: spoon,
	fork_and_knife: fork_and_knife,
	plate_with_cutlery: plate_with_cutlery,
	bowl_with_spoon: bowl_with_spoon,
	takeout_box: takeout_box,
	chopsticks: chopsticks,
	soccer: soccer,
	basketball: basketball,
	football: football,
	baseball: baseball,
	softball: softball,
	tennis: tennis,
	volleyball: volleyball,
	rugby_football: rugby_football,
	flying_disc: flying_disc,
	'8ball': {
		keywords: [
			'pool',
			'hobby',
			'game',
			'luck',
			'magic',
		],
		char: '🎱',
		fitzpatrick_scale: false,
		category: 'activity',
	},
	golf: golf,
	golfing_woman: golfing_woman,
	golfing_man: golfing_man,
	ping_pong: ping_pong,
	badminton: badminton,
	goal_net: goal_net,
	ice_hockey: ice_hockey,
	field_hockey: field_hockey,
	lacrosse: lacrosse,
	cricket: cricket,
	ski: ski,
	skier: skier,
	snowboarder: snowboarder,
	person_fencing: person_fencing,
	women_wrestling: women_wrestling,
	men_wrestling: men_wrestling,
	woman_cartwheeling: woman_cartwheeling,
	man_cartwheeling: man_cartwheeling,
	woman_playing_handball: woman_playing_handball,
	man_playing_handball: man_playing_handball,
	ice_skate: ice_skate,
	curling_stone: curling_stone,
	skateboard: skateboard,
	sled: sled,
	bow_and_arrow: bow_and_arrow,
	fishing_pole_and_fish: fishing_pole_and_fish,
	boxing_glove: boxing_glove,
	martial_arts_uniform: martial_arts_uniform,
	rowing_woman: rowing_woman,
	rowing_man: rowing_man,
	climbing_woman: climbing_woman,
	climbing_man: climbing_man,
	swimming_woman: swimming_woman,
	swimming_man: swimming_man,
	woman_playing_water_polo: woman_playing_water_polo,
	man_playing_water_polo: man_playing_water_polo,
	woman_in_lotus_position: woman_in_lotus_position,
	man_in_lotus_position: man_in_lotus_position,
	surfing_woman: surfing_woman,
	surfing_man: surfing_man,
	bath: bath,
	basketball_woman: basketball_woman,
	basketball_man: basketball_man,
	weight_lifting_woman: weight_lifting_woman,
	weight_lifting_man: weight_lifting_man,
	biking_woman: biking_woman,
	biking_man: biking_man,
	mountain_biking_woman: mountain_biking_woman,
	mountain_biking_man: mountain_biking_man,
	horse_racing: horse_racing,
	business_suit_levitating: business_suit_levitating,
	trophy: trophy,
	running_shirt_with_sash: running_shirt_with_sash,
	medal_sports: medal_sports,
	medal_military: medal_military,
	'1st_place_medal': {
		keywords: [
			'award',
			'winning',
			'first',
		],
		char: '🥇',
		fitzpatrick_scale: false,
		category: 'activity',
	},
	'2nd_place_medal': {
		keywords: [
			'award',
			'second',
		],
		char: '🥈',
		fitzpatrick_scale: false,
		category: 'activity',
	},
	'3rd_place_medal': {
		keywords: [
			'award',
			'third',
		],
		char: '🥉',
		fitzpatrick_scale: false,
		category: 'activity',
	},
	reminder_ribbon: reminder_ribbon,
	rosette: rosette,
	ticket: ticket,
	tickets: tickets,
	performing_arts: performing_arts,
	art: art,
	circus_tent: circus_tent,
	woman_juggling: woman_juggling,
	man_juggling: man_juggling,
	microphone: microphone,
	headphones: headphones,
	musical_score: musical_score,
	musical_keyboard: musical_keyboard,
	drum: drum,
	saxophone: saxophone,
	trumpet: trumpet,
	guitar: guitar,
	violin: violin,
	clapper: clapper,
	video_game: video_game,
	space_invader: space_invader,
	dart: dart,
	game_die: game_die,
	chess_pawn: chess_pawn,
	slot_machine: slot_machine,
	jigsaw: jigsaw,
	bowling: bowling,
	red_car: red_car,
	taxi: taxi,
	blue_car: blue_car,
	bus: bus,
	trolleybus: trolleybus,
	racing_car: racing_car,
	police_car: police_car,
	ambulance: ambulance,
	fire_engine: fire_engine,
	minibus: minibus,
	truck: truck,
	articulated_lorry: articulated_lorry,
	tractor: tractor,
	kick_scooter: kick_scooter,
	motorcycle: motorcycle,
	bike: bike,
	motor_scooter: motor_scooter,
	rotating_light: rotating_light,
	oncoming_police_car: oncoming_police_car,
	oncoming_bus: oncoming_bus,
	oncoming_automobile: oncoming_automobile,
	oncoming_taxi: oncoming_taxi,
	aerial_tramway: aerial_tramway,
	mountain_cableway: mountain_cableway,
	suspension_railway: suspension_railway,
	railway_car: railway_car,
	train: train,
	monorail: monorail,
	bullettrain_side: bullettrain_side,
	bullettrain_front: bullettrain_front,
	light_rail: light_rail,
	mountain_railway: mountain_railway,
	steam_locomotive: steam_locomotive,
	train2: train2,
	metro: metro,
	tram: tram,
	station: station,
	flying_saucer: flying_saucer,
	helicopter: helicopter,
	small_airplane: small_airplane,
	airplane: airplane,
	flight_departure: flight_departure,
	flight_arrival: flight_arrival,
	sailboat: sailboat,
	motor_boat: motor_boat,
	speedboat: speedboat,
	ferry: ferry,
	passenger_ship: passenger_ship,
	rocket: rocket,
	artificial_satellite: artificial_satellite,
	seat: seat,
	canoe: canoe,
	anchor: anchor,
	construction: construction,
	fuelpump: fuelpump,
	busstop: busstop,
	vertical_traffic_light: vertical_traffic_light,
	traffic_light: traffic_light,
	checkered_flag: checkered_flag,
	ship: ship,
	ferris_wheel: ferris_wheel,
	roller_coaster: roller_coaster,
	carousel_horse: carousel_horse,
	building_construction: building_construction,
	foggy: foggy,
	tokyo_tower: tokyo_tower,
	factory: factory,
	fountain: fountain,
	rice_scene: rice_scene,
	mountain: mountain,
	mountain_snow: mountain_snow,
	mount_fuji: mount_fuji,
	volcano: volcano,
	japan: japan,
	camping: camping,
	tent: tent,
	national_park: national_park,
	motorway: motorway,
	railway_track: railway_track,
	sunrise: sunrise,
	sunrise_over_mountains: sunrise_over_mountains,
	desert: desert,
	beach_umbrella: beach_umbrella,
	desert_island: desert_island,
	city_sunrise: city_sunrise,
	city_sunset: city_sunset,
	cityscape: cityscape,
	night_with_stars: night_with_stars,
	bridge_at_night: bridge_at_night,
	milky_way: milky_way,
	stars: stars,
	sparkler: sparkler,
	fireworks: fireworks,
	rainbow: rainbow,
	houses: houses,
	european_castle: european_castle,
	japanese_castle: japanese_castle,
	stadium: stadium,
	statue_of_liberty: statue_of_liberty,
	house: house,
	house_with_garden: house_with_garden,
	derelict_house: derelict_house,
	office: office,
	department_store: department_store,
	post_office: post_office,
	european_post_office: european_post_office,
	hospital: hospital,
	bank: bank,
	hotel: hotel,
	convenience_store: convenience_store,
	school: school,
	love_hotel: love_hotel,
	wedding: wedding,
	classical_building: classical_building,
	church: church,
	mosque: mosque,
	synagogue: synagogue,
	kaaba: kaaba,
	shinto_shrine: shinto_shrine,
	watch: watch,
	iphone: iphone,
	calling: calling,
	computer: computer,
	keyboard: keyboard,
	desktop_computer: desktop_computer,
	printer: printer,
	computer_mouse: computer_mouse,
	trackball: trackball,
	joystick: joystick,
	clamp: clamp,
	minidisc: minidisc,
	floppy_disk: floppy_disk,
	cd: cd,
	dvd: dvd,
	vhs: vhs,
	camera: camera,
	camera_flash: camera_flash,
	video_camera: video_camera,
	movie_camera: movie_camera,
	film_projector: film_projector,
	film_strip: film_strip,
	telephone_receiver: telephone_receiver,
	phone: phone,
	pager: pager,
	fax: fax,
	tv: tv,
	radio: radio,
	studio_microphone: studio_microphone,
	level_slider: level_slider,
	control_knobs: control_knobs,
	compass: compass,
	stopwatch: stopwatch,
	timer_clock: timer_clock,
	alarm_clock: alarm_clock,
	mantelpiece_clock: mantelpiece_clock,
	hourglass_flowing_sand: hourglass_flowing_sand,
	hourglass: hourglass,
	satellite: satellite,
	battery: battery,
	electric_plug: electric_plug,
	bulb: bulb,
	flashlight: flashlight,
	candle: candle,
	fire_extinguisher: fire_extinguisher,
	wastebasket: wastebasket,
	oil_drum: oil_drum,
	money_with_wings: money_with_wings,
	dollar: dollar,
	yen: yen,
	euro: euro,
	pound: pound,
	moneybag: moneybag,
	credit_card: credit_card,
	gem: gem,
	balance_scale: balance_scale,
	toolbox: toolbox,
	wrench: wrench,
	hammer: hammer,
	hammer_and_pick: hammer_and_pick,
	hammer_and_wrench: hammer_and_wrench,
	pick: pick,
	nut_and_bolt: nut_and_bolt,
	gear: gear,
	brick: brick,
	chains: chains,
	magnet: magnet,
	gun: gun,
	bomb: bomb,
	firecracker: firecracker,
	hocho: hocho,
	dagger: dagger,
	crossed_swords: crossed_swords,
	shield: shield,
	smoking: smoking,
	skull_and_crossbones: skull_and_crossbones,
	coffin: coffin,
	funeral_urn: funeral_urn,
	amphora: amphora,
	crystal_ball: crystal_ball,
	prayer_beads: prayer_beads,
	nazar_amulet: nazar_amulet,
	barber: barber,
	alembic: alembic,
	telescope: telescope,
	microscope: microscope,
	hole: hole,
	pill: pill,
	syringe: syringe,
	dna: dna,
	microbe: microbe,
	petri_dish: petri_dish,
	test_tube: test_tube,
	thermometer: thermometer,
	broom: broom,
	basket: basket,
	toilet_paper: toilet_paper,
	label: label,
	bookmark: bookmark,
	toilet: toilet,
	shower: shower,
	bathtub: bathtub,
	soap: soap,
	sponge: sponge,
	lotion_bottle: lotion_bottle,
	key: key,
	old_key: old_key,
	couch_and_lamp: couch_and_lamp,
	sleeping_bed: sleeping_bed,
	bed: bed,
	door: door,
	bellhop_bell: bellhop_bell,
	teddy_bear: teddy_bear,
	framed_picture: framed_picture,
	world_map: world_map,
	parasol_on_ground: parasol_on_ground,
	moyai: moyai,
	shopping: shopping,
	shopping_cart: shopping_cart,
	balloon: balloon,
	flags: flags,
	ribbon: ribbon,
	gift: gift,
	confetti_ball: confetti_ball,
	tada: tada,
	dolls: dolls,
	wind_chime: wind_chime,
	crossed_flags: crossed_flags,
	izakaya_lantern: izakaya_lantern,
	red_envelope: red_envelope,
	email: email,
	envelope_with_arrow: envelope_with_arrow,
	incoming_envelope: incoming_envelope,
	'e-mail': {
		keywords: [
			'communication',
			'inbox',
		],
		char: '📧',
		fitzpatrick_scale: false,
		category: 'objects',
	},
	love_letter: love_letter,
	postbox: postbox,
	mailbox_closed: mailbox_closed,
	mailbox: mailbox,
	mailbox_with_mail: mailbox_with_mail,
	mailbox_with_no_mail: mailbox_with_no_mail,
	'package': {
		keywords: [
			'mail',
			'gift',
			'cardboard',
			'box',
			'moving',
		],
		char: '📦',
		fitzpatrick_scale: false,
		category: 'objects',
	},
	postal_horn: postal_horn,
	inbox_tray: inbox_tray,
	outbox_tray: outbox_tray,
	scroll: scroll,
	page_with_curl: page_with_curl,
	bookmark_tabs: bookmark_tabs,
	receipt: receipt,
	bar_chart: bar_chart,
	chart_with_upwards_trend: chart_with_upwards_trend,
	chart_with_downwards_trend: chart_with_downwards_trend,
	page_facing_up: page_facing_up,
	date: date,
	calendar: calendar,
	spiral_calendar: spiral_calendar,
	card_index: card_index,
	card_file_box: card_file_box,
	ballot_box: ballot_box,
	file_cabinet: file_cabinet,
	clipboard: clipboard,
	spiral_notepad: spiral_notepad,
	file_folder: file_folder,
	open_file_folder: open_file_folder,
	card_index_dividers: card_index_dividers,
	newspaper_roll: newspaper_roll,
	newspaper: newspaper,
	notebook: notebook,
	closed_book: closed_book,
	green_book: green_book,
	blue_book: blue_book,
	orange_book: orange_book,
	notebook_with_decorative_cover: notebook_with_decorative_cover,
	ledger: ledger,
	books: books,
	open_book: open_book,
	safety_pin: safety_pin,
	link: link,
	paperclip: paperclip,
	paperclips: paperclips,
	scissors: scissors,
	triangular_ruler: triangular_ruler,
	straight_ruler: straight_ruler,
	abacus: abacus,
	pushpin: pushpin,
	round_pushpin: round_pushpin,
	triangular_flag_on_post: triangular_flag_on_post,
	white_flag: white_flag,
	black_flag: black_flag,
	rainbow_flag: rainbow_flag,
	closed_lock_with_key: closed_lock_with_key,
	lock: lock,
	unlock: unlock,
	lock_with_ink_pen: lock_with_ink_pen,
	pen: pen,
	fountain_pen: fountain_pen,
	black_nib: black_nib,
	memo: memo,
	pencil2: pencil2,
	crayon: crayon,
	paintbrush: paintbrush,
	mag: mag,
	mag_right: mag_right,
	heart: heart,
	orange_heart: orange_heart,
	yellow_heart: yellow_heart,
	green_heart: green_heart,
	blue_heart: blue_heart,
	purple_heart: purple_heart,
	black_heart: black_heart,
	broken_heart: broken_heart,
	heavy_heart_exclamation: heavy_heart_exclamation,
	two_hearts: two_hearts,
	revolving_hearts: revolving_hearts,
	heartbeat: heartbeat,
	heartpulse: heartpulse,
	sparkling_heart: sparkling_heart,
	cupid: cupid,
	gift_heart: gift_heart,
	heart_decoration: heart_decoration,
	peace_symbol: peace_symbol,
	latin_cross: latin_cross,
	star_and_crescent: star_and_crescent,
	om: om,
	wheel_of_dharma: wheel_of_dharma,
	star_of_david: star_of_david,
	six_pointed_star: six_pointed_star,
	menorah: menorah,
	yin_yang: yin_yang,
	orthodox_cross: orthodox_cross,
	place_of_worship: place_of_worship,
	ophiuchus: ophiuchus,
	aries: aries,
	taurus: taurus,
	gemini: gemini,
	cancer: cancer,
	leo: leo,
	virgo: virgo,
	libra: libra,
	scorpius: scorpius,
	sagittarius: sagittarius,
	capricorn: capricorn,
	aquarius: aquarius,
	pisces: pisces,
	id: id,
	atom_symbol: atom_symbol,
	u7a7a: u7a7a,
	u5272: u5272,
	radioactive: radioactive,
	biohazard: biohazard,
	mobile_phone_off: mobile_phone_off,
	vibration_mode: vibration_mode,
	u6709: u6709,
	u7121: u7121,
	u7533: u7533,
	u55b6: u55b6,
	u6708: u6708,
	eight_pointed_black_star: eight_pointed_black_star,
	vs: vs,
	accept: accept,
	white_flower: white_flower,
	ideograph_advantage: ideograph_advantage,
	secret: secret,
	congratulations: congratulations,
	u5408: u5408,
	u6e80: u6e80,
	u7981: u7981,
	a: a,
	b: b,
	ab: ab,
	cl: cl,
	o2: o2,
	sos: sos,
	no_entry: no_entry,
	name_badge: name_badge,
	no_entry_sign: no_entry_sign,
	x: x,
	o: o,
	stop_sign: stop_sign,
	anger: anger,
	hotsprings: hotsprings,
	no_pedestrians: no_pedestrians,
	do_not_litter: do_not_litter,
	no_bicycles: no_bicycles,
	'non-potable_water': {
		keywords: [
			'drink',
			'faucet',
			'tap',
			'circle',
		],
		char: '🚱',
		fitzpatrick_scale: false,
		category: 'symbols',
	},
	underage: underage,
	no_mobile_phones: no_mobile_phones,
	exclamation: exclamation,
	grey_exclamation: grey_exclamation,
	question: question,
	grey_question: grey_question,
	bangbang: bangbang,
	interrobang: interrobang,
	low_brightness: low_brightness,
	high_brightness: high_brightness,
	trident: trident,
	fleur_de_lis: fleur_de_lis,
	part_alternation_mark: part_alternation_mark,
	warning: warning,
	children_crossing: children_crossing,
	beginner: beginner,
	recycle: recycle,
	u6307: u6307,
	chart: chart,
	sparkle: sparkle,
	eight_spoked_asterisk: eight_spoked_asterisk,
	negative_squared_cross_mark: negative_squared_cross_mark,
	white_check_mark: white_check_mark,
	diamond_shape_with_a_dot_inside: diamond_shape_with_a_dot_inside,
	cyclone: cyclone,
	loop: loop,
	globe_with_meridians: globe_with_meridians,
	m: m,
	atm: atm,
	sa: sa,
	passport_control: passport_control,
	customs: customs,
	baggage_claim: baggage_claim,
	left_luggage: left_luggage,
	wheelchair: wheelchair,
	no_smoking: no_smoking,
	wc: wc,
	parking: parking,
	potable_water: potable_water,
	mens: mens,
	womens: womens,
	baby_symbol: baby_symbol,
	restroom: restroom,
	put_litter_in_its_place: put_litter_in_its_place,
	cinema: cinema,
	signal_strength: signal_strength,
	koko: koko,
	ng: ng,
	ok: ok,
	up: up,
	cool: cool,
	'new': {
		keywords: [
			'blue-square',
			'words',
			'start',
		],
		char: '🆕',
		fitzpatrick_scale: false,
		category: 'symbols',
	},
	free: free,
	zero: zero,
	one: one,
	two: two,
	three: three,
	four: four,
	five: five,
	six: six,
	seven: seven,
	eight: eight,
	nine: nine,
	keycap_ten: keycap_ten,
	asterisk: asterisk,
	eject_button: eject_button,
	arrow_forward: arrow_forward,
	pause_button: pause_button,
	next_track_button: next_track_button,
	stop_button: stop_button,
	record_button: record_button,
	play_or_pause_button: play_or_pause_button,
	previous_track_button: previous_track_button,
	fast_forward: fast_forward,
	rewind: rewind,
	twisted_rightwards_arrows: twisted_rightwards_arrows,
	repeat: repeat,
	repeat_one: repeat_one,
	arrow_backward: arrow_backward,
	arrow_up_small: arrow_up_small,
	arrow_down_small: arrow_down_small,
	arrow_double_up: arrow_double_up,
	arrow_double_down: arrow_double_down,
	arrow_right: arrow_right,
	arrow_left: arrow_left,
	arrow_up: arrow_up,
	arrow_down: arrow_down,
	arrow_upper_right: arrow_upper_right,
	arrow_lower_right: arrow_lower_right,
	arrow_lower_left: arrow_lower_left,
	arrow_upper_left: arrow_upper_left,
	arrow_up_down: arrow_up_down,
	left_right_arrow: left_right_arrow,
	arrows_counterclockwise: arrows_counterclockwise,
	arrow_right_hook: arrow_right_hook,
	leftwards_arrow_with_hook: leftwards_arrow_with_hook,
	arrow_heading_up: arrow_heading_up,
	arrow_heading_down: arrow_heading_down,
	hash: hash,
	information_source: information_source,
	abc: abc,
	abcd: abcd,
	capital_abcd: capital_abcd,
	symbols: symbols,
	musical_note: musical_note,
	notes: notes,
	wavy_dash: wavy_dash,
	curly_loop: curly_loop,
	heavy_check_mark: heavy_check_mark,
	arrows_clockwise: arrows_clockwise,
	heavy_plus_sign: heavy_plus_sign,
	heavy_minus_sign: heavy_minus_sign,
	heavy_division_sign: heavy_division_sign,
	heavy_multiplication_x: heavy_multiplication_x,
	infinity: infinity,
	heavy_dollar_sign: heavy_dollar_sign,
	currency_exchange: currency_exchange,
	copyright: copyright,
	registered: registered,
	tm: tm,
	end: end,
	back: back,
	on: on,
	top: top,
	soon: soon,
	ballot_box_with_check: ballot_box_with_check,
	radio_button: radio_button,
	white_circle: white_circle,
	black_circle: black_circle,
	red_circle: red_circle,
	large_blue_circle: large_blue_circle,
	small_orange_diamond: small_orange_diamond,
	small_blue_diamond: small_blue_diamond,
	large_orange_diamond: large_orange_diamond,
	large_blue_diamond: large_blue_diamond,
	small_red_triangle: small_red_triangle,
	black_small_square: black_small_square,
	white_small_square: white_small_square,
	black_large_square: black_large_square,
	white_large_square: white_large_square,
	small_red_triangle_down: small_red_triangle_down,
	black_medium_square: black_medium_square,
	white_medium_square: white_medium_square,
	black_medium_small_square: black_medium_small_square,
	white_medium_small_square: white_medium_small_square,
	black_square_button: black_square_button,
	white_square_button: white_square_button,
	speaker: speaker,
	sound: sound,
	loud_sound: loud_sound,
	mute: mute,
	mega: mega,
	loudspeaker: loudspeaker,
	bell: bell,
	no_bell: no_bell,
	black_joker: black_joker,
	mahjong: mahjong,
	spades: spades,
	clubs: clubs,
	hearts: hearts,
	diamonds: diamonds,
	flower_playing_cards: flower_playing_cards,
	thought_balloon: thought_balloon,
	right_anger_bubble: right_anger_bubble,
	speech_balloon: speech_balloon,
	left_speech_bubble: left_speech_bubble,
	clock1: clock1,
	clock2: clock2,
	clock3: clock3,
	clock4: clock4,
	clock5: clock5,
	clock6: clock6,
	clock7: clock7,
	clock8: clock8,
	clock9: clock9,
	clock10: clock10,
	clock11: clock11,
	clock12: clock12,
	clock130: clock130,
	clock230: clock230,
	clock330: clock330,
	clock430: clock430,
	clock530: clock530,
	clock630: clock630,
	clock730: clock730,
	clock830: clock830,
	clock930: clock930,
	clock1030: clock1030,
	clock1130: clock1130,
	clock1230: clock1230,
	afghanistan: afghanistan,
	aland_islands: aland_islands,
	albania: albania,
	algeria: algeria,
	american_samoa: american_samoa,
	andorra: andorra,
	angola: angola,
	anguilla: anguilla,
	antarctica: antarctica,
	antigua_barbuda: antigua_barbuda,
	argentina: argentina,
	armenia: armenia,
	aruba: aruba,
	australia: australia,
	austria: austria,
	azerbaijan: azerbaijan,
	bahamas: bahamas,
	bahrain: bahrain,
	bangladesh: bangladesh,
	barbados: barbados,
	belarus: belarus,
	belgium: belgium,
	belize: belize,
	benin: benin,
	bermuda: bermuda,
	bhutan: bhutan,
	bolivia: bolivia,
	caribbean_netherlands: caribbean_netherlands,
	bosnia_herzegovina: bosnia_herzegovina,
	botswana: botswana,
	brazil: brazil,
	british_indian_ocean_territory: british_indian_ocean_territory,
	british_virgin_islands: british_virgin_islands,
	brunei: brunei,
	bulgaria: bulgaria,
	burkina_faso: burkina_faso,
	burundi: burundi,
	cape_verde: cape_verde,
	cambodia: cambodia,
	cameroon: cameroon,
	canada: canada,
	canary_islands: canary_islands,
	cayman_islands: cayman_islands,
	central_african_republic: central_african_republic,
	chad: chad,
	chile: chile,
	cn: cn,
	christmas_island: christmas_island,
	cocos_islands: cocos_islands,
	colombia: colombia,
	comoros: comoros,
	congo_brazzaville: congo_brazzaville,
	congo_kinshasa: congo_kinshasa,
	cook_islands: cook_islands,
	costa_rica: costa_rica,
	croatia: croatia,
	cuba: cuba,
	curacao: curacao,
	cyprus: cyprus,
	czech_republic: czech_republic,
	denmark: denmark,
	djibouti: djibouti,
	dominica: dominica,
	dominican_republic: dominican_republic,
	ecuador: ecuador,
	egypt: egypt,
	el_salvador: el_salvador,
	equatorial_guinea: equatorial_guinea,
	eritrea: eritrea,
	estonia: estonia,
	ethiopia: ethiopia,
	eu: eu,
	falkland_islands: falkland_islands,
	faroe_islands: faroe_islands,
	fiji: fiji,
	finland: finland,
	fr: fr,
	french_guiana: french_guiana,
	french_polynesia: french_polynesia,
	french_southern_territories: french_southern_territories,
	gabon: gabon,
	gambia: gambia,
	georgia: georgia,
	de: de,
	ghana: ghana,
	gibraltar: gibraltar,
	greece: greece,
	greenland: greenland,
	grenada: grenada,
	guadeloupe: guadeloupe,
	guam: guam,
	guatemala: guatemala,
	guernsey: guernsey,
	guinea: guinea,
	guinea_bissau: guinea_bissau,
	guyana: guyana,
	haiti: haiti,
	honduras: honduras,
	hong_kong: hong_kong,
	hungary: hungary,
	iceland: iceland,
	india: india,
	indonesia: indonesia,
	iran: iran,
	iraq: iraq,
	ireland: ireland,
	isle_of_man: isle_of_man,
	israel: israel,
	it: it,
	cote_divoire: cote_divoire,
	jamaica: jamaica,
	jp: jp,
	jersey: jersey,
	jordan: jordan,
	kazakhstan: kazakhstan,
	kenya: kenya,
	kiribati: kiribati,
	kosovo: kosovo,
	kuwait: kuwait,
	kyrgyzstan: kyrgyzstan,
	laos: laos,
	latvia: latvia,
	lebanon: lebanon,
	lesotho: lesotho,
	liberia: liberia,
	libya: libya,
	liechtenstein: liechtenstein,
	lithuania: lithuania,
	luxembourg: luxembourg,
	macau: macau,
	macedonia: macedonia,
	madagascar: madagascar,
	malawi: malawi,
	malaysia: malaysia,
	maldives: maldives,
	mali: mali,
	malta: malta,
	marshall_islands: marshall_islands,
	martinique: martinique,
	mauritania: mauritania,
	mauritius: mauritius,
	mayotte: mayotte,
	mexico: mexico,
	micronesia: micronesia,
	moldova: moldova,
	monaco: monaco,
	mongolia: mongolia,
	montenegro: montenegro,
	montserrat: montserrat,
	morocco: morocco,
	mozambique: mozambique,
	myanmar: myanmar,
	namibia: namibia,
	nauru: nauru,
	nepal: nepal,
	netherlands: netherlands,
	new_caledonia: new_caledonia,
	new_zealand: new_zealand,
	nicaragua: nicaragua,
	niger: niger,
	nigeria: nigeria,
	niue: niue,
	norfolk_island: norfolk_island,
	northern_mariana_islands: northern_mariana_islands,
	north_korea: north_korea,
	norway: norway,
	oman: oman,
	pakistan: pakistan,
	palau: palau,
	palestinian_territories: palestinian_territories,
	panama: panama,
	papua_new_guinea: papua_new_guinea,
	paraguay: paraguay,
	peru: peru,
	philippines: philippines,
	pitcairn_islands: pitcairn_islands,
	poland: poland,
	portugal: portugal,
	puerto_rico: puerto_rico,
	qatar: qatar,
	reunion: reunion,
	romania: romania,
	ru: ru,
	rwanda: rwanda,
	st_barthelemy: st_barthelemy,
	st_helena: st_helena,
	st_kitts_nevis: st_kitts_nevis,
	st_lucia: st_lucia,
	st_pierre_miquelon: st_pierre_miquelon,
	st_vincent_grenadines: st_vincent_grenadines,
	samoa: samoa,
	san_marino: san_marino,
	sao_tome_principe: sao_tome_principe,
	saudi_arabia: saudi_arabia,
	senegal: senegal,
	serbia: serbia,
	seychelles: seychelles,
	sierra_leone: sierra_leone,
	singapore: singapore,
	sint_maarten: sint_maarten,
	slovakia: slovakia,
	slovenia: slovenia,
	solomon_islands: solomon_islands,
	somalia: somalia,
	south_africa: south_africa,
	south_georgia_south_sandwich_islands: south_georgia_south_sandwich_islands,
	kr: kr,
	south_sudan: south_sudan,
	es: es,
	sri_lanka: sri_lanka,
	sudan: sudan,
	suriname: suriname,
	swaziland: swaziland,
	sweden: sweden,
	switzerland: switzerland,
	syria: syria,
	taiwan: taiwan,
	tajikistan: tajikistan,
	tanzania: tanzania,
	thailand: thailand,
	timor_leste: timor_leste,
	togo: togo,
	tokelau: tokelau,
	tonga: tonga,
	trinidad_tobago: trinidad_tobago,
	tunisia: tunisia,
	tr: tr,
	turkmenistan: turkmenistan,
	turks_caicos_islands: turks_caicos_islands,
	tuvalu: tuvalu,
	uganda: uganda,
	ukraine: ukraine,
	united_arab_emirates: united_arab_emirates,
	uk: uk,
	england: england,
	scotland: scotland,
	wales: wales,
	us: us,
	us_virgin_islands: us_virgin_islands,
	uruguay: uruguay,
	uzbekistan: uzbekistan,
	vanuatu: vanuatu,
	vatican_city: vatican_city,
	venezuela: venezuela,
	vietnam: vietnam,
	wallis_futuna: wallis_futuna,
	western_sahara: western_sahara,
	yemen: yemen,
	zambia: zambia,
	zimbabwe: zimbabwe,
	united_nations: united_nations,
	pirate_flag: pirate_flag,
};

const require$$1 = [
	'grinning',
	'smiley',
	'smile',
	'grin',
	'laughing',
	'sweat_smile',
	'joy',
	'rofl',
	'relaxed',
	'blush',
	'innocent',
	'slightly_smiling_face',
	'upside_down_face',
	'wink',
	'relieved',
	'heart_eyes',
	'smiling_face_with_three_hearts',
	'kissing_heart',
	'kissing',
	'kissing_smiling_eyes',
	'kissing_closed_eyes',
	'yum',
	'stuck_out_tongue',
	'stuck_out_tongue_closed_eyes',
	'stuck_out_tongue_winking_eye',
	'zany',
	'raised_eyebrow',
	'monocle',
	'nerd_face',
	'sunglasses',
	'star_struck',
	'partying',
	'smirk',
	'unamused',
	'disappointed',
	'pensive',
	'worried',
	'confused',
	'slightly_frowning_face',
	'frowning_face',
	'persevere',
	'confounded',
	'tired_face',
	'weary',
	'pleading',
	'cry',
	'sob',
	'triumph',
	'angry',
	'rage',
	'symbols_over_mouth',
	'exploding_head',
	'flushed',
	'hot',
	'cold',
	'scream',
	'fearful',
	'cold_sweat',
	'disappointed_relieved',
	'sweat',
	'hugs',
	'thinking',
	'hand_over_mouth',
	'shushing',
	'lying_face',
	'no_mouth',
	'neutral_face',
	'expressionless',
	'grimacing',
	'roll_eyes',
	'hushed',
	'frowning',
	'anguished',
	'open_mouth',
	'astonished',
	'sleeping',
	'drooling_face',
	'sleepy',
	'dizzy_face',
	'zipper_mouth_face',
	'woozy',
	'nauseated_face',
	'vomiting',
	'sneezing_face',
	'mask',
	'face_with_thermometer',
	'face_with_head_bandage',
	'money_mouth_face',
	'cowboy_hat_face',
	'smiling_imp',
	'imp',
	'japanese_ogre',
	'japanese_goblin',
	'clown_face',
	'poop',
	'ghost',
	'skull',
	'skull_and_crossbones',
	'alien',
	'space_invader',
	'robot',
	'jack_o_lantern',
	'smiley_cat',
	'smile_cat',
	'joy_cat',
	'heart_eyes_cat',
	'smirk_cat',
	'kissing_cat',
	'scream_cat',
	'crying_cat_face',
	'pouting_cat',
	'palms_up',
	'open_hands',
	'raised_hands',
	'clap',
	'handshake',
	'+1',
	'-1',
	'facepunch',
	'fist',
	'fist_left',
	'fist_right',
	'crossed_fingers',
	'v',
	'love_you',
	'metal',
	'ok_hand',
	'point_left',
	'point_right',
	'point_up',
	'point_down',
	'point_up_2',
	'raised_hand',
	'raised_back_of_hand',
	'raised_hand_with_fingers_splayed',
	'vulcan_salute',
	'wave',
	'call_me_hand',
	'muscle',
	'fu',
	'writing_hand',
	'pray',
	'foot',
	'leg',
	'ring',
	'lipstick',
	'kiss',
	'lips',
	'tooth',
	'tongue',
	'ear',
	'nose',
	'footprints',
	'eye',
	'eyes',
	'brain',
	'speaking_head',
	'bust_in_silhouette',
	'busts_in_silhouette',
	'baby',
	'girl',
	'child',
	'boy',
	'woman',
	'adult',
	'man',
	'blonde_woman',
	'blonde_man',
	'bearded_person',
	'older_woman',
	'older_adult',
	'older_man',
	'man_with_gua_pi_mao',
	'woman_with_headscarf',
	'woman_with_turban',
	'man_with_turban',
	'policewoman',
	'policeman',
	'construction_worker_woman',
	'construction_worker_man',
	'guardswoman',
	'guardsman',
	'female_detective',
	'male_detective',
	'woman_health_worker',
	'man_health_worker',
	'woman_farmer',
	'man_farmer',
	'woman_cook',
	'man_cook',
	'woman_student',
	'man_student',
	'woman_singer',
	'man_singer',
	'woman_teacher',
	'man_teacher',
	'woman_factory_worker',
	'man_factory_worker',
	'woman_technologist',
	'man_technologist',
	'woman_office_worker',
	'man_office_worker',
	'woman_mechanic',
	'man_mechanic',
	'woman_scientist',
	'man_scientist',
	'woman_artist',
	'man_artist',
	'woman_firefighter',
	'man_firefighter',
	'woman_pilot',
	'man_pilot',
	'woman_astronaut',
	'man_astronaut',
	'woman_judge',
	'man_judge',
	'bride_with_veil',
	'man_in_tuxedo',
	'princess',
	'prince',
	'woman_superhero',
	'man_superhero',
	'woman_supervillain',
	'man_supervillain',
	'mrs_claus',
	'santa',
	'sorceress',
	'wizard',
	'woman_elf',
	'man_elf',
	'woman_vampire',
	'man_vampire',
	'woman_zombie',
	'man_zombie',
	'woman_genie',
	'man_genie',
	'mermaid',
	'merman',
	'woman_fairy',
	'man_fairy',
	'angel',
	'pregnant_woman',
	'breastfeeding',
	'bowing_woman',
	'bowing_man',
	'tipping_hand_woman',
	'tipping_hand_man',
	'no_good_woman',
	'no_good_man',
	'ok_woman',
	'ok_man',
	'raising_hand_woman',
	'raising_hand_man',
	'woman_facepalming',
	'man_facepalming',
	'woman_shrugging',
	'man_shrugging',
	'pouting_woman',
	'pouting_man',
	'frowning_woman',
	'frowning_man',
	'haircut_woman',
	'haircut_man',
	'massage_woman',
	'massage_man',
	'woman_in_steamy_room',
	'man_in_steamy_room',
	'nail_care',
	'selfie',
	'dancer',
	'man_dancing',
	'dancing_women',
	'dancing_men',
	'business_suit_levitating',
	'walking_woman',
	'walking_man',
	'running_woman',
	'running_man',
	'couple',
	'two_women_holding_hands',
	'two_men_holding_hands',
	'couple_with_heart_woman_man',
	'couple_with_heart_woman_woman',
	'couple_with_heart_man_man',
	'couplekiss_man_woman',
	'couplekiss_woman_woman',
	'couplekiss_man_man',
	'family_man_woman_boy',
	'family_man_woman_girl',
	'family_man_woman_girl_boy',
	'family_man_woman_boy_boy',
	'family_man_woman_girl_girl',
	'family_woman_woman_boy',
	'family_woman_woman_girl',
	'family_woman_woman_girl_boy',
	'family_woman_woman_boy_boy',
	'family_woman_woman_girl_girl',
	'family_man_man_boy',
	'family_man_man_girl',
	'family_man_man_girl_boy',
	'family_man_man_boy_boy',
	'family_man_man_girl_girl',
	'family_woman_boy',
	'family_woman_girl',
	'family_woman_girl_boy',
	'family_woman_boy_boy',
	'family_woman_girl_girl',
	'family_man_boy',
	'family_man_girl',
	'family_man_girl_boy',
	'family_man_boy_boy',
	'family_man_girl_girl',
	'yarn',
	'thread',
	'coat',
	'labcoat',
	'womans_clothes',
	'tshirt',
	'jeans',
	'necktie',
	'dress',
	'bikini',
	'kimono',
	'flat_shoe',
	'high_heel',
	'sandal',
	'boot',
	'mans_shoe',
	'athletic_shoe',
	'hiking_boot',
	'socks',
	'gloves',
	'scarf',
	'tophat',
	'billed_hat',
	'womans_hat',
	'mortar_board',
	'rescue_worker_helmet',
	'crown',
	'pouch',
	'purse',
	'handbag',
	'briefcase',
	'school_satchel',
	'luggage',
	'eyeglasses',
	'dark_sunglasses',
	'goggles',
	'closed_umbrella',
	'dog',
	'cat',
	'mouse',
	'hamster',
	'rabbit',
	'fox_face',
	'bear',
	'panda_face',
	'koala',
	'tiger',
	'lion',
	'cow',
	'pig',
	'pig_nose',
	'frog',
	'monkey_face',
	'see_no_evil',
	'hear_no_evil',
	'speak_no_evil',
	'monkey',
	'chicken',
	'penguin',
	'bird',
	'baby_chick',
	'hatching_chick',
	'hatched_chick',
	'duck',
	'eagle',
	'owl',
	'bat',
	'wolf',
	'boar',
	'horse',
	'unicorn',
	'honeybee',
	'bug',
	'butterfly',
	'snail',
	'shell',
	'beetle',
	'ant',
	'mosquito',
	'grasshopper',
	'spider',
	'spider_web',
	'scorpion',
	'turtle',
	'snake',
	'lizard',
	't-rex',
	'sauropod',
	'octopus',
	'squid',
	'shrimp',
	'lobster',
	'crab',
	'blowfish',
	'tropical_fish',
	'fish',
	'dolphin',
	'whale',
	'whale2',
	'shark',
	'crocodile',
	'tiger2',
	'leopard',
	'zebra',
	'gorilla',
	'elephant',
	'hippopotamus',
	'rhinoceros',
	'dromedary_camel',
	'giraffe',
	'kangaroo',
	'camel',
	'water_buffalo',
	'ox',
	'cow2',
	'racehorse',
	'pig2',
	'ram',
	'sheep',
	'llama',
	'goat',
	'deer',
	'dog2',
	'poodle',
	'cat2',
	'rooster',
	'turkey',
	'peacock',
	'parrot',
	'swan',
	'dove',
	'rabbit2',
	'raccoon',
	'badger',
	'rat',
	'mouse2',
	'chipmunk',
	'hedgehog',
	'paw_prints',
	'dragon',
	'dragon_face',
	'cactus',
	'christmas_tree',
	'evergreen_tree',
	'deciduous_tree',
	'palm_tree',
	'seedling',
	'herb',
	'shamrock',
	'four_leaf_clover',
	'bamboo',
	'tanabata_tree',
	'leaves',
	'fallen_leaf',
	'maple_leaf',
	'ear_of_rice',
	'hibiscus',
	'sunflower',
	'rose',
	'wilted_flower',
	'tulip',
	'blossom',
	'cherry_blossom',
	'bouquet',
	'mushroom',
	'earth_americas',
	'earth_africa',
	'earth_asia',
	'full_moon',
	'waning_gibbous_moon',
	'last_quarter_moon',
	'waning_crescent_moon',
	'new_moon',
	'waxing_crescent_moon',
	'first_quarter_moon',
	'waxing_gibbous_moon',
	'new_moon_with_face',
	'full_moon_with_face',
	'first_quarter_moon_with_face',
	'last_quarter_moon_with_face',
	'sun_with_face',
	'crescent_moon',
	'star',
	'star2',
	'dizzy',
	'sparkles',
	'comet',
	'sunny',
	'sun_behind_small_cloud',
	'partly_sunny',
	'sun_behind_large_cloud',
	'sun_behind_rain_cloud',
	'cloud',
	'cloud_with_rain',
	'cloud_with_lightning_and_rain',
	'cloud_with_lightning',
	'zap',
	'fire',
	'boom',
	'snowflake',
	'cloud_with_snow',
	'snowman',
	'snowman_with_snow',
	'wind_face',
	'dash',
	'tornado',
	'fog',
	'open_umbrella',
	'umbrella',
	'droplet',
	'sweat_drops',
	'ocean',
	'green_apple',
	'apple',
	'pear',
	'tangerine',
	'lemon',
	'banana',
	'watermelon',
	'grapes',
	'strawberry',
	'melon',
	'cherries',
	'peach',
	'mango',
	'pineapple',
	'coconut',
	'kiwi_fruit',
	'tomato',
	'eggplant',
	'avocado',
	'broccoli',
	'leafy_greens',
	'cucumber',
	'hot_pepper',
	'corn',
	'carrot',
	'potato',
	'sweet_potato',
	'croissant',
	'bagel',
	'bread',
	'baguette_bread',
	'pretzel',
	'cheese',
	'egg',
	'fried_egg',
	'pancakes',
	'bacon',
	'steak',
	'poultry_leg',
	'meat_on_bone',
	'bone',
	'hotdog',
	'hamburger',
	'fries',
	'pizza',
	'sandwich',
	'stuffed_flatbread',
	'taco',
	'burrito',
	'green_salad',
	'shallow_pan_of_food',
	'canned_food',
	'spaghetti',
	'ramen',
	'stew',
	'curry',
	'sushi',
	'bento',
	'fried_shrimp',
	'rice_ball',
	'rice',
	'rice_cracker',
	'fish_cake',
	'fortune_cookie',
	'moon_cake',
	'oden',
	'dango',
	'shaved_ice',
	'ice_cream',
	'icecream',
	'pie',
	'cupcake',
	'cake',
	'birthday',
	'custard',
	'lollipop',
	'candy',
	'chocolate_bar',
	'popcorn',
	'doughnut',
	'dumpling',
	'cookie',
	'chestnut',
	'peanuts',
	'honey_pot',
	'milk_glass',
	'baby_bottle',
	'coffee',
	'tea',
	'cup_with_straw',
	'sake',
	'beer',
	'beers',
	'clinking_glasses',
	'wine_glass',
	'tumbler_glass',
	'cocktail',
	'tropical_drink',
	'champagne',
	'spoon',
	'fork_and_knife',
	'plate_with_cutlery',
	'bowl_with_spoon',
	'takeout_box',
	'chopsticks',
	'salt',
	'soccer',
	'basketball',
	'football',
	'baseball',
	'softball',
	'tennis',
	'volleyball',
	'rugby_football',
	'flying_disc',
	'8ball',
	'golf',
	'golfing_woman',
	'golfing_man',
	'ping_pong',
	'badminton',
	'goal_net',
	'ice_hockey',
	'field_hockey',
	'lacrosse',
	'cricket',
	'ski',
	'skier',
	'snowboarder',
	'person_fencing',
	'women_wrestling',
	'men_wrestling',
	'woman_cartwheeling',
	'man_cartwheeling',
	'woman_playing_handball',
	'man_playing_handball',
	'ice_skate',
	'curling_stone',
	'skateboard',
	'sled',
	'bow_and_arrow',
	'fishing_pole_and_fish',
	'boxing_glove',
	'martial_arts_uniform',
	'rowing_woman',
	'rowing_man',
	'climbing_woman',
	'climbing_man',
	'swimming_woman',
	'swimming_man',
	'woman_playing_water_polo',
	'man_playing_water_polo',
	'woman_in_lotus_position',
	'man_in_lotus_position',
	'surfing_woman',
	'surfing_man',
	'basketball_woman',
	'basketball_man',
	'weight_lifting_woman',
	'weight_lifting_man',
	'biking_woman',
	'biking_man',
	'mountain_biking_woman',
	'mountain_biking_man',
	'horse_racing',
	'trophy',
	'running_shirt_with_sash',
	'medal_sports',
	'medal_military',
	'1st_place_medal',
	'2nd_place_medal',
	'3rd_place_medal',
	'reminder_ribbon',
	'rosette',
	'ticket',
	'tickets',
	'performing_arts',
	'art',
	'circus_tent',
	'woman_juggling',
	'man_juggling',
	'microphone',
	'headphones',
	'musical_score',
	'musical_keyboard',
	'drum',
	'saxophone',
	'trumpet',
	'guitar',
	'violin',
	'clapper',
	'video_game',
	'dart',
	'game_die',
	'chess_pawn',
	'slot_machine',
	'jigsaw',
	'bowling',
	'red_car',
	'taxi',
	'blue_car',
	'bus',
	'trolleybus',
	'racing_car',
	'police_car',
	'ambulance',
	'fire_engine',
	'minibus',
	'truck',
	'articulated_lorry',
	'tractor',
	'kick_scooter',
	'motorcycle',
	'bike',
	'motor_scooter',
	'rotating_light',
	'oncoming_police_car',
	'oncoming_bus',
	'oncoming_automobile',
	'oncoming_taxi',
	'aerial_tramway',
	'mountain_cableway',
	'suspension_railway',
	'railway_car',
	'train',
	'monorail',
	'bullettrain_side',
	'bullettrain_front',
	'light_rail',
	'mountain_railway',
	'steam_locomotive',
	'train2',
	'metro',
	'tram',
	'station',
	'flying_saucer',
	'helicopter',
	'small_airplane',
	'airplane',
	'flight_departure',
	'flight_arrival',
	'sailboat',
	'motor_boat',
	'speedboat',
	'ferry',
	'passenger_ship',
	'rocket',
	'artificial_satellite',
	'seat',
	'canoe',
	'anchor',
	'construction',
	'fuelpump',
	'busstop',
	'vertical_traffic_light',
	'traffic_light',
	'ship',
	'ferris_wheel',
	'roller_coaster',
	'carousel_horse',
	'building_construction',
	'foggy',
	'tokyo_tower',
	'factory',
	'fountain',
	'rice_scene',
	'mountain',
	'mountain_snow',
	'mount_fuji',
	'volcano',
	'japan',
	'camping',
	'tent',
	'national_park',
	'motorway',
	'railway_track',
	'sunrise',
	'sunrise_over_mountains',
	'desert',
	'beach_umbrella',
	'desert_island',
	'city_sunrise',
	'city_sunset',
	'cityscape',
	'night_with_stars',
	'bridge_at_night',
	'milky_way',
	'stars',
	'sparkler',
	'fireworks',
	'rainbow',
	'houses',
	'european_castle',
	'japanese_castle',
	'stadium',
	'statue_of_liberty',
	'house',
	'house_with_garden',
	'derelict_house',
	'office',
	'department_store',
	'post_office',
	'european_post_office',
	'hospital',
	'bank',
	'hotel',
	'convenience_store',
	'school',
	'love_hotel',
	'wedding',
	'classical_building',
	'church',
	'mosque',
	'synagogue',
	'kaaba',
	'shinto_shrine',
	'watch',
	'iphone',
	'calling',
	'computer',
	'keyboard',
	'desktop_computer',
	'printer',
	'computer_mouse',
	'trackball',
	'joystick',
	'clamp',
	'minidisc',
	'floppy_disk',
	'cd',
	'dvd',
	'vhs',
	'camera',
	'camera_flash',
	'video_camera',
	'movie_camera',
	'film_projector',
	'film_strip',
	'telephone_receiver',
	'phone',
	'pager',
	'fax',
	'tv',
	'radio',
	'studio_microphone',
	'level_slider',
	'control_knobs',
	'compass',
	'stopwatch',
	'timer_clock',
	'alarm_clock',
	'mantelpiece_clock',
	'hourglass_flowing_sand',
	'hourglass',
	'satellite',
	'battery',
	'electric_plug',
	'bulb',
	'flashlight',
	'candle',
	'fire_extinguisher',
	'wastebasket',
	'oil_drum',
	'money_with_wings',
	'dollar',
	'yen',
	'euro',
	'pound',
	'moneybag',
	'credit_card',
	'gem',
	'balance_scale',
	'toolbox',
	'wrench',
	'hammer',
	'hammer_and_pick',
	'hammer_and_wrench',
	'pick',
	'nut_and_bolt',
	'gear',
	'brick',
	'chains',
	'magnet',
	'gun',
	'bomb',
	'firecracker',
	'hocho',
	'dagger',
	'crossed_swords',
	'shield',
	'smoking',
	'coffin',
	'funeral_urn',
	'amphora',
	'crystal_ball',
	'prayer_beads',
	'nazar_amulet',
	'barber',
	'alembic',
	'telescope',
	'microscope',
	'hole',
	'pill',
	'syringe',
	'dna',
	'microbe',
	'petri_dish',
	'test_tube',
	'thermometer',
	'broom',
	'basket',
	'toilet_paper',
	'label',
	'bookmark',
	'toilet',
	'shower',
	'bathtub',
	'bath',
	'soap',
	'sponge',
	'lotion_bottle',
	'key',
	'old_key',
	'couch_and_lamp',
	'sleeping_bed',
	'bed',
	'door',
	'bellhop_bell',
	'teddy_bear',
	'framed_picture',
	'world_map',
	'parasol_on_ground',
	'moyai',
	'shopping',
	'shopping_cart',
	'balloon',
	'flags',
	'ribbon',
	'gift',
	'confetti_ball',
	'tada',
	'dolls',
	'wind_chime',
	'crossed_flags',
	'izakaya_lantern',
	'red_envelope',
	'email',
	'envelope_with_arrow',
	'incoming_envelope',
	'e-mail',
	'love_letter',
	'postbox',
	'mailbox_closed',
	'mailbox',
	'mailbox_with_mail',
	'mailbox_with_no_mail',
	'package',
	'postal_horn',
	'inbox_tray',
	'outbox_tray',
	'scroll',
	'page_with_curl',
	'bookmark_tabs',
	'receipt',
	'bar_chart',
	'chart_with_upwards_trend',
	'chart_with_downwards_trend',
	'page_facing_up',
	'date',
	'calendar',
	'spiral_calendar',
	'card_index',
	'card_file_box',
	'ballot_box',
	'file_cabinet',
	'clipboard',
	'spiral_notepad',
	'file_folder',
	'open_file_folder',
	'card_index_dividers',
	'newspaper_roll',
	'newspaper',
	'notebook',
	'closed_book',
	'green_book',
	'blue_book',
	'orange_book',
	'notebook_with_decorative_cover',
	'ledger',
	'books',
	'open_book',
	'safety_pin',
	'link',
	'paperclip',
	'paperclips',
	'scissors',
	'triangular_ruler',
	'straight_ruler',
	'abacus',
	'pushpin',
	'round_pushpin',
	'closed_lock_with_key',
	'lock',
	'unlock',
	'lock_with_ink_pen',
	'pen',
	'fountain_pen',
	'black_nib',
	'memo',
	'pencil2',
	'crayon',
	'paintbrush',
	'mag',
	'mag_right',
	'heart',
	'orange_heart',
	'yellow_heart',
	'green_heart',
	'blue_heart',
	'purple_heart',
	'black_heart',
	'broken_heart',
	'heavy_heart_exclamation',
	'two_hearts',
	'revolving_hearts',
	'heartbeat',
	'heartpulse',
	'sparkling_heart',
	'cupid',
	'gift_heart',
	'heart_decoration',
	'peace_symbol',
	'latin_cross',
	'star_and_crescent',
	'om',
	'wheel_of_dharma',
	'star_of_david',
	'six_pointed_star',
	'menorah',
	'yin_yang',
	'orthodox_cross',
	'place_of_worship',
	'ophiuchus',
	'aries',
	'taurus',
	'gemini',
	'cancer',
	'leo',
	'virgo',
	'libra',
	'scorpius',
	'sagittarius',
	'capricorn',
	'aquarius',
	'pisces',
	'id',
	'atom_symbol',
	'u7a7a',
	'u5272',
	'radioactive',
	'biohazard',
	'mobile_phone_off',
	'vibration_mode',
	'u6709',
	'u7121',
	'u7533',
	'u55b6',
	'u6708',
	'eight_pointed_black_star',
	'vs',
	'accept',
	'white_flower',
	'ideograph_advantage',
	'secret',
	'congratulations',
	'u5408',
	'u6e80',
	'u7981',
	'a',
	'b',
	'ab',
	'cl',
	'o2',
	'sos',
	'no_entry',
	'name_badge',
	'no_entry_sign',
	'x',
	'o',
	'stop_sign',
	'anger',
	'hotsprings',
	'no_pedestrians',
	'do_not_litter',
	'no_bicycles',
	'non-potable_water',
	'underage',
	'no_mobile_phones',
	'exclamation',
	'grey_exclamation',
	'question',
	'grey_question',
	'bangbang',
	'interrobang',
	'100',
	'low_brightness',
	'high_brightness',
	'trident',
	'fleur_de_lis',
	'part_alternation_mark',
	'warning',
	'children_crossing',
	'beginner',
	'recycle',
	'u6307',
	'chart',
	'sparkle',
	'eight_spoked_asterisk',
	'negative_squared_cross_mark',
	'white_check_mark',
	'diamond_shape_with_a_dot_inside',
	'cyclone',
	'loop',
	'globe_with_meridians',
	'm',
	'atm',
	'zzz',
	'sa',
	'passport_control',
	'customs',
	'baggage_claim',
	'left_luggage',
	'wheelchair',
	'no_smoking',
	'wc',
	'parking',
	'potable_water',
	'mens',
	'womens',
	'baby_symbol',
	'restroom',
	'put_litter_in_its_place',
	'cinema',
	'signal_strength',
	'koko',
	'ng',
	'ok',
	'up',
	'cool',
	'new',
	'free',
	'zero',
	'one',
	'two',
	'three',
	'four',
	'five',
	'six',
	'seven',
	'eight',
	'nine',
	'keycap_ten',
	'asterisk',
	'1234',
	'eject_button',
	'arrow_forward',
	'pause_button',
	'next_track_button',
	'stop_button',
	'record_button',
	'play_or_pause_button',
	'previous_track_button',
	'fast_forward',
	'rewind',
	'twisted_rightwards_arrows',
	'repeat',
	'repeat_one',
	'arrow_backward',
	'arrow_up_small',
	'arrow_down_small',
	'arrow_double_up',
	'arrow_double_down',
	'arrow_right',
	'arrow_left',
	'arrow_up',
	'arrow_down',
	'arrow_upper_right',
	'arrow_lower_right',
	'arrow_lower_left',
	'arrow_upper_left',
	'arrow_up_down',
	'left_right_arrow',
	'arrows_counterclockwise',
	'arrow_right_hook',
	'leftwards_arrow_with_hook',
	'arrow_heading_up',
	'arrow_heading_down',
	'hash',
	'information_source',
	'abc',
	'abcd',
	'capital_abcd',
	'symbols',
	'musical_note',
	'notes',
	'wavy_dash',
	'curly_loop',
	'heavy_check_mark',
	'arrows_clockwise',
	'heavy_plus_sign',
	'heavy_minus_sign',
	'heavy_division_sign',
	'heavy_multiplication_x',
	'infinity',
	'heavy_dollar_sign',
	'currency_exchange',
	'copyright',
	'registered',
	'tm',
	'end',
	'back',
	'on',
	'top',
	'soon',
	'ballot_box_with_check',
	'radio_button',
	'white_circle',
	'black_circle',
	'red_circle',
	'large_blue_circle',
	'small_orange_diamond',
	'small_blue_diamond',
	'large_orange_diamond',
	'large_blue_diamond',
	'small_red_triangle',
	'black_small_square',
	'white_small_square',
	'black_large_square',
	'white_large_square',
	'small_red_triangle_down',
	'black_medium_square',
	'white_medium_square',
	'black_medium_small_square',
	'white_medium_small_square',
	'black_square_button',
	'white_square_button',
	'speaker',
	'sound',
	'loud_sound',
	'mute',
	'mega',
	'loudspeaker',
	'bell',
	'no_bell',
	'black_joker',
	'mahjong',
	'spades',
	'clubs',
	'hearts',
	'diamonds',
	'flower_playing_cards',
	'thought_balloon',
	'right_anger_bubble',
	'speech_balloon',
	'left_speech_bubble',
	'clock1',
	'clock2',
	'clock3',
	'clock4',
	'clock5',
	'clock6',
	'clock7',
	'clock8',
	'clock9',
	'clock10',
	'clock11',
	'clock12',
	'clock130',
	'clock230',
	'clock330',
	'clock430',
	'clock530',
	'clock630',
	'clock730',
	'clock830',
	'clock930',
	'clock1030',
	'clock1130',
	'clock1230',
	'white_flag',
	'black_flag',
	'pirate_flag',
	'checkered_flag',
	'triangular_flag_on_post',
	'rainbow_flag',
	'united_nations',
	'afghanistan',
	'aland_islands',
	'albania',
	'algeria',
	'american_samoa',
	'andorra',
	'angola',
	'anguilla',
	'antarctica',
	'antigua_barbuda',
	'argentina',
	'armenia',
	'aruba',
	'australia',
	'austria',
	'azerbaijan',
	'bahamas',
	'bahrain',
	'bangladesh',
	'barbados',
	'belarus',
	'belgium',
	'belize',
	'benin',
	'bermuda',
	'bhutan',
	'bolivia',
	'caribbean_netherlands',
	'bosnia_herzegovina',
	'botswana',
	'brazil',
	'british_indian_ocean_territory',
	'british_virgin_islands',
	'brunei',
	'bulgaria',
	'burkina_faso',
	'burundi',
	'cape_verde',
	'cambodia',
	'cameroon',
	'canada',
	'canary_islands',
	'cayman_islands',
	'central_african_republic',
	'chad',
	'chile',
	'cn',
	'christmas_island',
	'cocos_islands',
	'colombia',
	'comoros',
	'congo_brazzaville',
	'congo_kinshasa',
	'cook_islands',
	'costa_rica',
	'croatia',
	'cuba',
	'curacao',
	'cyprus',
	'czech_republic',
	'denmark',
	'djibouti',
	'dominica',
	'dominican_republic',
	'ecuador',
	'egypt',
	'el_salvador',
	'equatorial_guinea',
	'eritrea',
	'estonia',
	'ethiopia',
	'eu',
	'falkland_islands',
	'faroe_islands',
	'fiji',
	'finland',
	'fr',
	'french_guiana',
	'french_polynesia',
	'french_southern_territories',
	'gabon',
	'gambia',
	'georgia',
	'de',
	'ghana',
	'gibraltar',
	'greece',
	'greenland',
	'grenada',
	'guadeloupe',
	'guam',
	'guatemala',
	'guernsey',
	'guinea',
	'guinea_bissau',
	'guyana',
	'haiti',
	'honduras',
	'hong_kong',
	'hungary',
	'iceland',
	'india',
	'indonesia',
	'iran',
	'iraq',
	'ireland',
	'isle_of_man',
	'israel',
	'it',
	'cote_divoire',
	'jamaica',
	'jp',
	'jersey',
	'jordan',
	'kazakhstan',
	'kenya',
	'kiribati',
	'kosovo',
	'kuwait',
	'kyrgyzstan',
	'laos',
	'latvia',
	'lebanon',
	'lesotho',
	'liberia',
	'libya',
	'liechtenstein',
	'lithuania',
	'luxembourg',
	'macau',
	'macedonia',
	'madagascar',
	'malawi',
	'malaysia',
	'maldives',
	'mali',
	'malta',
	'marshall_islands',
	'martinique',
	'mauritania',
	'mauritius',
	'mayotte',
	'mexico',
	'micronesia',
	'moldova',
	'monaco',
	'mongolia',
	'montenegro',
	'montserrat',
	'morocco',
	'mozambique',
	'myanmar',
	'namibia',
	'nauru',
	'nepal',
	'netherlands',
	'new_caledonia',
	'new_zealand',
	'nicaragua',
	'niger',
	'nigeria',
	'niue',
	'norfolk_island',
	'northern_mariana_islands',
	'north_korea',
	'norway',
	'oman',
	'pakistan',
	'palau',
	'palestinian_territories',
	'panama',
	'papua_new_guinea',
	'paraguay',
	'peru',
	'philippines',
	'pitcairn_islands',
	'poland',
	'portugal',
	'puerto_rico',
	'qatar',
	'reunion',
	'romania',
	'ru',
	'rwanda',
	'st_barthelemy',
	'st_helena',
	'st_kitts_nevis',
	'st_lucia',
	'st_pierre_miquelon',
	'st_vincent_grenadines',
	'samoa',
	'san_marino',
	'sao_tome_principe',
	'saudi_arabia',
	'senegal',
	'serbia',
	'seychelles',
	'sierra_leone',
	'singapore',
	'sint_maarten',
	'slovakia',
	'slovenia',
	'solomon_islands',
	'somalia',
	'south_africa',
	'south_georgia_south_sandwich_islands',
	'kr',
	'south_sudan',
	'es',
	'sri_lanka',
	'sudan',
	'suriname',
	'swaziland',
	'sweden',
	'switzerland',
	'syria',
	'taiwan',
	'tajikistan',
	'tanzania',
	'thailand',
	'timor_leste',
	'togo',
	'tokelau',
	'tonga',
	'trinidad_tobago',
	'tunisia',
	'tr',
	'turkmenistan',
	'turks_caicos_islands',
	'tuvalu',
	'uganda',
	'ukraine',
	'united_arab_emirates',
	'uk',
	'england',
	'scotland',
	'wales',
	'us',
	'us_virgin_islands',
	'uruguay',
	'uzbekistan',
	'vanuatu',
	'vatican_city',
	'venezuela',
	'vietnam',
	'wallis_futuna',
	'western_sahara',
	'yemen',
	'zambia',
	'zimbabwe',
];

let emojilib;
let hasRequiredEmojilib;

function requireEmojilib () {
	if (hasRequiredEmojilib) return emojilib;
	hasRequiredEmojilib = 1;
	emojilib = {
	  lib: require$$0,
	  ordered: require$$1,
	  fitzpatrick_scale_modifiers: ['🏻', '🏼', '🏽', '🏾', '🏿'],
	};
	return emojilib;
}

let hasRequiredLib;

function requireLib () {
	if (hasRequiredLib) return lib$2.exports;
	hasRequiredLib = 1;

	const mapO = requireLib$1(),
	    iterateObject = requireLib$2();

	let emoji = requireEmojilib();

	const nameMap = lib$2.exports = {};
	nameMap.emoji = mapO(emoji.lib, value => value.char, true);
	iterateObject(nameMap.emoji, (value, name, obj) => !value && delete obj[name] || true);

	/**
	 * get
	 * Gets the emoji character (unicode) by providing the name.
	 *
	 * @name get
	 * @function
	 * @param {String} name The emoji name.
	 * @return {String} The emoji character (unicode).
	 */
	nameMap.get = function (name) {
	    if (name.charAt(0) === ':') {
	        name = name.slice(1, -1);
	    }
	    return this.emoji[name];
	};

	emoji = null;
	return lib$2.exports;
}

const libExports = requireLib();
const emoji = /* @__PURE__*/getDefaultExportFromCjs(libExports);

export { emoji as e };
// # sourceMappingURL=index-U7-39QVn.js.map
