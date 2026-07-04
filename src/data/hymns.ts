export type HymnCategory =
  | 'Worship & Praise'
  | 'Grace & Salvation'
  | 'Faith & Trust'
  | 'Prayer & Devotion'
  | "God's Love"
  | 'Christmas'
  | 'Easter & Resurrection'
  | 'Comfort & Peace'
  | 'Service & Mission';

export type HymnVerse = { lines: string[] };

export type Hymn = {
  id: string;
  number: number;
  title: string;
  author: string;
  year: number;
  category: HymnCategory;
  tags: string[];
  featured: boolean;
  verses: HymnVerse[];
  chorus?: HymnVerse;
};

export const HYMN_CATEGORIES: HymnCategory[] = [
  'Worship & Praise',
  'Grace & Salvation',
  'Faith & Trust',
  'Prayer & Devotion',
  "God's Love",
];

export const HYMNS: Hymn[] = [

  // ── WORSHIP & PRAISE ──────────────────────────────────────────────────────

  {
    id: 'holy-holy-holy', number: 1, title: 'Holy, Holy, Holy', author: 'Reginald Heber',
    year: 1826, category: 'Worship & Praise', featured: true,
    tags: ['Trinity', 'Adoration', 'Morning'],
    verses: [
      { lines: ['Holy, holy, holy! Lord God Almighty!', 'Early in the morning our song shall rise to Thee;', 'Holy, holy, holy! Merciful and mighty!', 'God in three Persons, blessed Trinity!'] },
      { lines: ['Holy, holy, holy! All the saints adore Thee,', 'Casting down their golden crowns around the glassy sea;', 'Cherubim and seraphim falling down before Thee,', 'Which wert, and art, and evermore shalt be.'] },
      { lines: ['Holy, holy, holy! Though the darkness hide Thee,', 'Though the eye of sinful man Thy glory may not see,', 'Only Thou art holy; there is none beside Thee,', 'Perfect in power, in love, and purity.'] },
      { lines: ['Holy, holy, holy! Lord God Almighty!', 'All Thy works shall praise Thy name, in earth and sky and sea;', 'Holy, holy, holy! Merciful and mighty!', 'God in three Persons, blessed Trinity!'] },
    ],
  },

  {
    id: 'how-great-thou-art', number: 2, title: 'How Great Thou Art', author: 'Carl Boberg / Stuart Hine',
    year: 1885, category: 'Worship & Praise', featured: true,
    tags: ['Creation', 'Awe', 'Praise'],
    chorus: { lines: ['Then sings my soul, my Savior God, to Thee:', 'How great Thou art, how great Thou art!', 'Then sings my soul, my Savior God, to Thee:', 'How great Thou art, how great Thou art!'] },
    verses: [
      { lines: ['O Lord my God, when I in awesome wonder', 'Consider all the worlds Thy hands have made,', 'I see the stars, I hear the rolling thunder,', 'Thy power throughout the universe displayed.'] },
      { lines: ['When through the woods and forest glades I wander,', 'And hear the birds sing sweetly in the trees,', 'When I look down from lofty mountain grandeur,', 'And hear the brook and feel the gentle breeze.'] },
      { lines: ['And when I think that God, His Son not sparing,', 'Sent Him to die, I scarce can take it in,', 'That on the cross, my burden gladly bearing,', 'He bled and died to take away my sin.'] },
      { lines: ['When Christ shall come with shout of acclamation', 'And take me home, what joy shall fill my heart!', 'Then I shall bow in humble adoration,', 'And there proclaim, my God, how great Thou art!'] },
    ],
  },

  {
    id: 'great-is-thy-faithfulness', number: 3, title: 'Great Is Thy Faithfulness', author: 'Thomas Chisholm',
    year: 1923, category: 'Worship & Praise', featured: true,
    tags: ['Faithfulness', 'Mercy', 'Morning'],
    chorus: { lines: ['Great is Thy faithfulness! Great is Thy faithfulness!', 'Morning by morning new mercies I see;', 'All I have needed Thy hand hath provided;', 'Great is Thy faithfulness, Lord, unto me!'] },
    verses: [
      { lines: ['Great is Thy faithfulness, O God my Father,', 'There is no shadow of turning with Thee;', 'Thou changest not, Thy compassions, they fail not;', 'As Thou hast been, Thou forever wilt be.'] },
      { lines: ['Summer and winter and springtime and harvest,', 'Sun, moon and stars in their courses above,', 'Join with all nature in manifold witness', 'To Thy great faithfulness, mercy and love.'] },
      { lines: ['Pardon for sin and a peace that endureth,', "Thine own dear presence to cheer and to guide,", 'Strength for today and bright hope for tomorrow,', 'Blessings all mine, with ten thousand beside!'] },
    ],
  },

  {
    id: 'joyful-joyful', number: 4, title: 'Joyful, Joyful, We Adore Thee', author: 'Henry van Dyke',
    year: 1907, category: 'Worship & Praise', featured: true,
    tags: ['Joy', 'Adoration', 'Creation'],
    verses: [
      { lines: ['Joyful, joyful, we adore Thee,', 'God of glory, Lord of love;', 'Hearts unfold like flowers before Thee,', 'Opening to the sun above.', 'Melt the clouds of sin and sadness,', 'Drive the dark of doubt away;', 'Giver of immortal gladness,', 'Fill us with the light of day!'] },
      { lines: ['All Thy works with joy surround Thee,', 'Earth and heaven reflect Thy rays,', 'Stars and angels sing around Thee,', 'Center of unbroken praise.', 'Field and forest, vale and mountain,', 'Flowery meadow, flashing sea,', 'Chanting bird and flowing fountain,', 'Call us to rejoice in Thee.'] },
      { lines: ['Thou art giving and forgiving,', 'Ever blessing, ever blest,', 'Wellspring of the joy of living,', 'Ocean depth of happy rest!', 'Thou our Father, Christ our Brother,', 'All who live in love are Thine;', 'Teach us how to love each other,', 'Lift us to the joy divine.'] },
      { lines: ['Mortals, join the mighty chorus,', 'Which the morning stars began;', 'Father love is reigning o\'er us,', 'Brother love binds man to man.', 'Ever singing, march we onward,', 'Victors in the midst of strife;', 'Joyful music leads us sunward', 'In the triumph song of life.'] },
    ],
  },

  {
    id: 'crown-him-with-many-crowns', number: 5, title: 'Crown Him with Many Crowns', author: 'Matthew Bridges',
    year: 1851, category: 'Worship & Praise', featured: true,
    tags: ['Royalty', 'Adoration', 'Resurrection'],
    verses: [
      { lines: ['Crown Him with many crowns,', 'The Lamb upon His throne;', 'Hark! how the heavenly anthem drowns', 'All music but its own!', 'Awake, my soul, and sing', 'Of Him who died for thee,', 'And hail Him as thy matchless King', 'Through all eternity.'] },
      { lines: ['Crown Him the Lord of life,', 'Who triumphed o\'er the grave,', 'And rose victorious in the strife', 'For those He came to save.', 'His glories now we sing,', 'Who died and rose on high,', 'Who died eternal life to bring,', 'And lives that death may die.'] },
      { lines: ['Crown Him the Lord of love;', 'Behold His hands and side,', 'Those wounds yet visible above', 'In beauty glorified.', 'No angel in the sky', 'Can fully bear that sight,', 'But downward bends his burning eye', 'At mysteries so bright.'] },
      { lines: ['Crown Him the Lord of years,', 'The potentate of time,', 'Creator of the rolling spheres,', 'Ineffably sublime.', 'All hail, Redeemer, hail!', 'For Thou hast died for me;', 'Thy praise and glory shall not fail', 'Throughout eternity.'] },
    ],
  },

  {
    id: 'praise-to-the-lord', number: 6, title: 'Praise to the Lord, the Almighty', author: 'Joachim Neander',
    year: 1680, category: 'Worship & Praise', featured: true,
    tags: ['Praise', 'Almighty', 'Adoration'],
    verses: [
      { lines: ['Praise to the Lord, the Almighty, the King of creation!', 'O my soul, praise Him, for He is thy health and salvation!', 'All ye who hear, now to His temple draw near;', 'Praise Him in glad adoration.'] },
      { lines: ['Praise to the Lord, who o\'er all things so wondrously reigneth,', 'Shelters thee under His wings, yea, so gently sustaineth!', 'Hast thou not seen how thy desires e\'er have been', 'Granted in what He ordaineth?'] },
      { lines: ['Praise to the Lord, who doth prosper thy work and defend thee;', 'Surely His goodness and mercy here daily attend thee.', 'Ponder anew what the Almighty can do,', 'If with His love He befriend thee.'] },
      { lines: ['Praise to the Lord, O let all that is in me adore Him!', 'All that hath life and breath, come now with praises before Him.', 'Let the Amen sound from His people again,', 'Gladly for aye we adore Him.'] },
    ],
  },

  {
    id: 'all-creatures', number: 7, title: 'All Creatures of Our God and King', author: 'Francis of Assisi',
    year: 1225, category: 'Worship & Praise', featured: false,
    tags: ['Creation', 'Praise', 'Nature'],
    verses: [
      { lines: ['All creatures of our God and King,', 'Lift up your voice and with us sing,', 'Alleluia! Alleluia!', 'Thou burning sun with golden beam,', 'Thou silver moon with softer gleam,', 'O praise Him! O praise Him!', 'Alleluia! Alleluia! Alleluia!'] },
      { lines: ['Thou rushing wind that art so strong,', 'Ye clouds that sail in heaven along,', 'O praise Him! Alleluia!', 'Thou rising morn, in praise rejoice,', 'Ye lights of evening, find a voice,', 'O praise Him! O praise Him!', 'Alleluia! Alleluia! Alleluia!'] },
      { lines: ['Thou flowing water, pure and clear,', 'Make music for thy Lord to hear,', 'Alleluia! Alleluia!', 'Thou fire so masterful and bright,', 'That givest man both warmth and light,', 'O praise Him! O praise Him!', 'Alleluia! Alleluia! Alleluia!'] },
      { lines: ['Let all things their Creator bless,', 'And worship Him in humbleness,', 'O praise Him! Alleluia!', 'Praise, praise the Father, praise the Son,', 'And praise the Spirit, Three in One,', 'O praise Him! O praise Him!', 'Alleluia! Alleluia! Alleluia!'] },
    ],
  },

  {
    id: 'to-god-be-the-glory', number: 8, title: 'To God Be the Glory', author: 'Fanny Crosby',
    year: 1875, category: 'Worship & Praise', featured: true,
    tags: ['Glory', 'Salvation', 'Praise'],
    chorus: { lines: ['Praise the Lord, praise the Lord,', 'Let the earth hear His voice!', 'Praise the Lord, praise the Lord,', 'Let the people rejoice!', 'O come to the Father, through Jesus the Son,', 'And give Him the glory, great things He hath done!'] },
    verses: [
      { lines: ['To God be the glory, great things He hath done!', 'So loved He the world that He gave us His Son,', 'Who yielded His life an atonement for sin,', 'And opened the lifegate that all may go in.'] },
      { lines: ['O perfect redemption, the purchase of blood,', 'To every believer the promise of God;', 'The vilest offender who truly believes,', 'That moment from Jesus a pardon receives.'] },
      { lines: ['Great things He hath taught us, great things He hath done,', 'And great our rejoicing through Jesus the Son;', 'But purer, and higher, and greater will be', 'Our wonder, our transport, when Jesus we see.'] },
    ],
  },

  {
    id: 'fairest-lord-jesus', number: 9, title: 'Fairest Lord Jesus', author: 'Anonymous',
    year: 1677, category: 'Worship & Praise', featured: true,
    tags: ['Beauty', 'Adoration', 'Nature'],
    verses: [
      { lines: ['Fairest Lord Jesus, Ruler of all nature,', 'O Thou of God and man the Son,', 'Thee will I cherish, Thee will I honor,', 'Thou, my soul\'s glory, joy, and crown.'] },
      { lines: ['Fair are the meadows, fairer still the woodlands,', 'Robed in the blooming garb of spring;', 'Jesus is fairer, Jesus is purer,', 'Who makes the woeful heart to sing.'] },
      { lines: ['Fair is the sunshine, fairer still the moonlight,', 'And all the twinkling, starry host;', 'Jesus shines brighter, Jesus shines purer', 'Than all the angels heaven can boast.'] },
      { lines: ['Beautiful Savior! Lord of all the nations!', 'Son of God and Son of Man!', 'Glory and honor, praise, adoration,', 'Now and forevermore be Thine.'] },
    ],
  },

  {
    id: 'immortal-invisible', number: 10, title: 'Immortal, Invisible, God Only Wise', author: 'Walter Smith',
    year: 1867, category: 'Worship & Praise', featured: false,
    tags: ['God\'s Nature', 'Light', 'Majesty'],
    verses: [
      { lines: ['Immortal, invisible, God only wise,', 'In light inaccessible hid from our eyes,', 'Most blessed, most glorious, the Ancient of Days,', 'Almighty, victorious, Thy great name we praise.'] },
      { lines: ['Unresting, unhasting, and silent as light,', 'Nor wanting, nor wasting, Thou rulest in might;', 'Thy justice like mountains high soaring above', 'Thy clouds which are fountains of goodness and love.'] },
      { lines: ['To all life Thou givest, to both great and small;', 'In all life Thou livest, the true life of all;', 'We blossom and flourish as leaves on the tree,', 'And wither and perish, but naught changeth Thee.'] },
      { lines: ['Thou reignest in glory; Thou dwellest in light,', 'Thine angels adore Thee, all veiling their sight;', 'All laud we would render; O help us to see', '\'Tis only the splendor of light hideth Thee.'] },
    ],
  },

  {
    id: 'o-worship-the-king', number: 11, title: 'O Worship the King', author: 'Robert Grant',
    year: 1833, category: 'Worship & Praise', featured: false,
    tags: ['Majesty', 'King', 'Creation'],
    verses: [
      { lines: ['O worship the King, all glorious above,', 'O gratefully sing His power and His love;', 'Our Shield and Defender, the Ancient of Days,', 'Pavilioned in splendor and girded with praise.'] },
      { lines: ['O tell of His might, O sing of His grace,', 'Whose robe is the light, whose canopy space;', 'His chariots of wrath the deep thunderclouds form,', 'And dark is His path on the wings of the storm.'] },
      { lines: ['Thy bountiful care, what tongue can recite?', 'It breathes in the air, it shines in the light;', 'It streams from the hills, it descends to the plain,', 'And sweetly distills in the dew and the rain.'] },
      { lines: ['Frail children of dust, and feeble as frail,', 'In Thee do we trust, nor find Thee to fail;', 'Thy mercies how tender, how firm to the end,', 'Our Maker, Defender, Redeemer, and Friend.'] },
    ],
  },

  {
    id: 'come-thou-almighty-king', number: 12, title: 'Come, Thou Almighty King', author: 'Anonymous',
    year: 1757, category: 'Worship & Praise', featured: false,
    tags: ['Trinity', 'King', 'Adoration'],
    verses: [
      { lines: ['Come, Thou Almighty King,', 'Help us Thy name to sing,', 'Help us to praise!', 'Father, all glorious,', 'O\'er all victorious,', 'Come, and reign over us,', 'Ancient of Days!'] },
      { lines: ['Come, Thou Incarnate Word,', 'Gird on Thy mighty sword,', 'Our prayer attend!', 'Come, and Thy people bless,', 'And give Thy Word success,', 'Spirit of holiness,', 'On us descend!'] },
      { lines: ['Come, Holy Comforter,', 'Thy sacred witness bear', 'In this glad hour!', 'Thou who almighty art,', 'Now rule in every heart,', 'And ne\'er from us depart,', 'Spirit of power!'] },
      { lines: ['To Thee, great One in Three,', 'Eternal praises be', 'Hence evermore!', 'Thy sovereign majesty', 'May we in glory see,', 'And to eternity', 'Love and adore!'] },
    ],
  },

  {
    id: 'rejoice-the-lord-is-king', number: 13, title: 'Rejoice, the Lord Is King', author: 'Charles Wesley',
    year: 1746, category: 'Worship & Praise', featured: false,
    tags: ['Rejoice', 'Kingship', 'Victory'],
    chorus: { lines: ['Lift up your heart, lift up your voice!', 'Rejoice! Again I say, rejoice!'] },
    verses: [
      { lines: ['Rejoice, the Lord is King!', 'Your Lord and King adore!', 'Rejoice, give thanks, and sing', 'And triumph evermore.'] },
      { lines: ['The Lord our Savior reigns,', 'The God of truth and love;', 'When He had purged our stains,', 'He took His seat above.'] },
      { lines: ['His kingdom cannot fail;', 'He rules o\'er earth and heaven;', 'The keys of death and hell', 'Are to our Jesus given.'] },
      { lines: ['He all His foes shall quell,', 'Shall all our sins destroy,', 'And every bosom swell', 'With pure seraphic joy.'] },
    ],
  },

  {
    id: 'o-for-a-thousand-tongues', number: 14, title: 'O for a Thousand Tongues to Sing', author: 'Charles Wesley',
    year: 1739, category: 'Worship & Praise', featured: false,
    tags: ['Praise', 'Jesus', 'Grace'],
    verses: [
      { lines: ['O for a thousand tongues to sing', 'My great Redeemer\'s praise,', 'The glories of my God and King,', 'The triumphs of His grace!'] },
      { lines: ['My gracious Master and my God,', 'Assist me to proclaim,', 'To spread through all the earth abroad', 'The honors of Thy name.'] },
      { lines: ['Jesus! the name that charms our fears,', 'That bids our sorrows cease,', '\'Tis music in the sinner\'s ears,', '\'Tis life and health and peace.'] },
      { lines: ['He breaks the power of canceled sin,', 'He sets the prisoner free;', 'His blood can make the foulest clean;', 'His blood availed for me.'] },
      { lines: ['He speaks, and, listening to His voice,', 'New life the dead receive;', 'The mournful, broken hearts rejoice;', 'The humble poor believe.'] },
    ],
  },

  {
    id: 'this-is-my-fathers-world', number: 15, title: "This Is My Father's World", author: 'Maltbie Babcock',
    year: 1901, category: 'Worship & Praise', featured: false,
    tags: ['Creation', 'Providence', 'Nature'],
    verses: [
      { lines: ['This is my Father\'s world,', 'And to my listening ears', 'All nature sings, and round me rings', 'The music of the spheres.', 'This is my Father\'s world:', 'I rest me in the thought', 'Of rocks and trees, of skies and seas;', 'His hand the wonders wrought.'] },
      { lines: ['This is my Father\'s world,', 'The birds their carols raise,', 'The morning light, the lily white,', 'Declare their Maker\'s praise.', 'This is my Father\'s world:', 'He shines in all that\'s fair;', 'In the rustling grass I hear Him pass;', 'He speaks to me everywhere.'] },
      { lines: ['This is my Father\'s world.', 'O let me ne\'er forget', 'That though the wrong seems oft so strong,', 'God is the ruler yet.', 'This is my Father\'s world:', 'Why should my heart be sad?', 'The Lord is King; let the heavens ring!', 'God reigns; let the earth be glad!'] },
    ],
  },

  // ── WORSHIP & PRAISE (cont.) ──────────────────────────────────────────────

  {
    id: 'now-thank-we-all', number: 16, title: 'Now Thank We All Our God', author: 'Martin Rinkart',
    year: 1636, category: 'Worship & Praise', featured: false,
    tags: ['Thanksgiving', 'Gratitude', 'Blessing'],
    verses: [
      { lines: ['Now thank we all our God,', 'With heart and hands and voices,', 'Who wondrous things has done,', 'In whom His world rejoices;', 'Who from our mothers\' arms', 'Has blessed us on our way', 'With countless gifts of love,', 'And still is ours today.'] },
      { lines: ['O may this bounteous God', 'Through all our life be near us,', 'With ever joyful hearts', 'And blessed peace to cheer us;', 'And keep us in His grace,', 'And guide us when perplexed,', 'And free us from all ills', 'In this world and the next.'] },
      { lines: ['All praise and thanks to God', 'The Father now be given,', 'The Son and Him who reigns', 'With them in highest heaven,', 'The one eternal God,', 'Whom earth and heaven adore;', 'For thus it was, is now,', 'And shall be evermore.'] },
    ],
  },

  {
    id: 'god-of-our-fathers', number: 17, title: 'God of Our Fathers', author: 'Daniel Roberts',
    year: 1876, category: 'Worship & Praise', featured: false,
    tags: ['Nation', 'Providence', 'History'],
    verses: [
      { lines: ['God of our fathers, whose almighty hand', 'Leads forth in beauty all the starry band', 'Of shining worlds in splendor through the skies,', 'Our grateful songs before Thy throne arise.'] },
      { lines: ['Thy love divine hath led us in the past,', 'In this free land by Thee our lot is cast;', 'Be Thou our ruler, guardian, guide, and stay,', 'Thy word our law, Thy paths our chosen way.'] },
      { lines: ['From war\'s alarms, from deadly pestilence,', 'Be Thy strong arm our ever sure defense;', 'Thy true religion in our hearts increase,', 'Thy bounteous goodness nourish us in peace.'] },
      { lines: ['Refresh Thy people on their toilsome way,', 'Lead us from night to never-ending day;', 'Fill all our lives with love and grace divine,', 'And glory, laud, and praise be ever Thine.'] },
    ],
  },

  {
    id: 'we-gather-together', number: 18, title: 'We Gather Together', author: 'Netherlands Folk Hymn',
    year: 1597, category: 'Worship & Praise', featured: false,
    tags: ['Thanksgiving', 'Community', 'Protection'],
    verses: [
      { lines: ['We gather together to ask the Lord\'s blessing;', 'He chastens and hastens His will to make known;', 'The wicked oppressing now cease from distressing;', 'Sing praises to His name; He forgets not His own.'] },
      { lines: ['Beside us to guide us, our God with us joining,', 'Ordaining, maintaining His kingdom divine;', 'So from the beginning the fight we were winning;', 'Thou, Lord, wast at our side: all glory be Thine!'] },
      { lines: ['We all do extol Thee, Thou leader triumphant,', 'And pray that Thou still our defender wilt be.', 'Let Thy congregation escape tribulation;', 'Thy name be ever praised! O Lord, make us free!'] },
    ],
  },

  {
    id: 'all-people-on-earth', number: 19, title: 'All People That on Earth Do Dwell', author: 'William Kethe',
    year: 1561, category: 'Worship & Praise', featured: false,
    tags: ['Doxology', 'Praise', 'Psalms'],
    verses: [
      { lines: ['All people that on earth do dwell,', 'Sing to the Lord with cheerful voice;', 'Him serve with fear, His praise forth tell,', 'Come ye before Him and rejoice.'] },
      { lines: ['The Lord, ye know, is God indeed;', 'Without our aid He did us make;', 'We are His folk, He doth us feed,', 'And for His sheep He doth us take.'] },
      { lines: ['O enter then His gates with praise,', 'Approach with joy His courts unto;', 'Praise, laud, and bless His name always,', 'For it is seemly so to do.'] },
      { lines: ['For why? the Lord our God is good,', 'His mercy is for ever sure;', 'His truth at all times firmly stood,', 'And shall from age to age endure.'] },
    ],
  },

  {
    id: 'sing-praise-to-god', number: 20, title: 'Sing Praise to God Who Reigns Above', author: 'Johann Schütz',
    year: 1675, category: 'Worship & Praise', featured: false,
    tags: ['Praise', 'Providence', 'Majesty'],
    verses: [
      { lines: ['Sing praise to God who reigns above,', 'The God of all creation,', 'The God of power, the God of love,', 'The God of our salvation;', 'With healing balm my soul He fills,', 'And every faithless murmur stills:', 'To God all praise and glory!'] },
      { lines: ['The Lord is never far away,', 'But through all grief distressing,', 'An ever-present help and stay,', 'Our peace and joy and blessing;', 'As with a mother\'s tender hand,', 'He leads His own, His chosen band:', 'To God all praise and glory!'] },
      { lines: ['Thus all my toilsome way along,', 'I sing aloud Thy praises,', 'That men may hear the grateful song', 'My voice unwearied raises;', 'Be joyful in the Lord, my heart,', 'Both soul and body bear your part:', 'To God all praise and glory!'] },
    ],
  },

  // ── GRACE & SALVATION ─────────────────────────────────────────────────────

  {
    id: 'amazing-grace', number: 21, title: 'Amazing Grace', author: 'John Newton',
    year: 1772, category: 'Grace & Salvation', featured: true,
    tags: ['Grace', 'Salvation', 'Redemption'],
    verses: [
      { lines: ['Amazing grace! how sweet the sound', 'That saved a wretch like me!', 'I once was lost, but now am found,', 'Was blind, but now I see.'] },
      { lines: ['\'Twas grace that taught my heart to fear,', 'And grace my fears relieved;', 'How precious did that grace appear', 'The hour I first believed!'] },
      { lines: ['Through many dangers, toils, and snares,', 'I have already come;', '\'Tis grace hath brought me safe thus far,', 'And grace will lead me home.'] },
      { lines: ['The Lord has promised good to me,', 'His word my hope secures;', 'He will my shield and portion be,', 'As long as life endures.'] },
      { lines: ['When we\'ve been there ten thousand years,', 'Bright shining as the sun,', 'We\'ve no less days to sing God\'s praise', 'Than when we first begun.'] },
    ],
  },

  {
    id: 'rock-of-ages', number: 22, title: 'Rock of Ages', author: 'Augustus Toplady',
    year: 1776, category: 'Grace & Salvation', featured: true,
    tags: ['Atonement', 'Refuge', 'Blood of Christ'],
    verses: [
      { lines: ['Rock of Ages, cleft for me,', 'Let me hide myself in Thee;', 'Let the water and the blood,', 'From Thy wounded side which flowed,', 'Be of sin the double cure,', 'Save from wrath and make me pure.'] },
      { lines: ['Not the labor of my hands', 'Can fulfill Thy law\'s demands;', 'Could my zeal no respite know,', 'Could my tears forever flow,', 'All for sin could not atone;', 'Thou must save, and Thou alone.'] },
      { lines: ['Nothing in my hand I bring,', 'Simply to the cross I cling;', 'Naked, come to Thee for dress;', 'Helpless, look to Thee for grace;', 'Foul, I to the fountain fly;', 'Wash me, Savior, or I die.'] },
      { lines: ['While I draw this fleeting breath,', 'When mine eyes shall close in death,', 'When I soar to worlds unknown,', 'See Thee on Thy judgment throne,', 'Rock of Ages, cleft for me,', 'Let me hide myself in Thee.'] },
    ],
  },

  {
    id: 'blessed-assurance', number: 23, title: 'Blessed Assurance', author: 'Fanny Crosby',
    year: 1873, category: 'Grace & Salvation', featured: true,
    tags: ['Assurance', 'Salvation', 'Peace'],
    chorus: { lines: ['This is my story, this is my song,', 'Praising my Savior all the day long;', 'This is my story, this is my song,', 'Praising my Savior all the day long.'] },
    verses: [
      { lines: ['Blessed assurance, Jesus is mine!', 'O what a foretaste of glory divine!', 'Heir of salvation, purchase of God,', 'Born of His Spirit, washed in His blood.'] },
      { lines: ['Perfect submission, perfect delight,', 'Visions of rapture now burst on my sight;', 'Angels descending bring from above', 'Echoes of mercy, whispers of love.'] },
      { lines: ['Perfect submission, all is at rest,', 'I in my Savior am happy and blest,', 'Watching and waiting, looking above,', 'Filled with His goodness, lost in His love.'] },
    ],
  },

  {
    id: 'just-as-i-am', number: 24, title: 'Just As I Am', author: 'Charlotte Elliott',
    year: 1835, category: 'Grace & Salvation', featured: true,
    tags: ['Invitation', 'Surrender', 'Grace'],
    verses: [
      { lines: ['Just as I am, without one plea,', 'But that Thy blood was shed for me,', 'And that Thou bidd\'st me come to Thee,', 'O Lamb of God, I come, I come.'] },
      { lines: ['Just as I am, and waiting not', 'To rid my soul of one dark blot,', 'To Thee whose blood can cleanse each spot,', 'O Lamb of God, I come, I come.'] },
      { lines: ['Just as I am, though tossed about', 'With many a conflict, many a doubt,', 'Fightings and fears within, without,', 'O Lamb of God, I come, I come.'] },
      { lines: ['Just as I am, poor, wretched, blind;', 'Sight, riches, healing of the mind,', 'Yea, all I need, in Thee to find,', 'O Lamb of God, I come, I come.'] },
      { lines: ['Just as I am, Thou wilt receive,', 'Wilt welcome, pardon, cleanse, relieve;', 'Because Thy promise I believe,', 'O Lamb of God, I come, I come.'] },
    ],
  },

  {
    id: 'when-i-survey', number: 25, title: 'When I Survey the Wondrous Cross', author: 'Isaac Watts',
    year: 1707, category: 'Grace & Salvation', featured: true,
    tags: ['Cross', 'Atonement', 'Sacrifice'],
    verses: [
      { lines: ['When I survey the wondrous cross', 'On which the Prince of glory died,', 'My richest gain I count but loss,', 'And pour contempt on all my pride.'] },
      { lines: ['Forbid it, Lord, that I should boast,', 'Save in the death of Christ my God!', 'All the vain things that charm me most,', 'I sacrifice them to His blood.'] },
      { lines: ['See from His head, His hands, His feet,', 'Sorrow and love flow mingled down!', 'Did e\'er such love and sorrow meet,', 'Or thorns compose so rich a crown?'] },
      { lines: ['Were the whole realm of nature mine,', 'That were a present far too small;', 'Love so amazing, so divine,', 'Demands my soul, my life, my all.'] },
    ],
  },

  {
    id: 'old-rugged-cross', number: 26, title: 'The Old Rugged Cross', author: 'George Bennard',
    year: 1913, category: 'Grace & Salvation', featured: true,
    tags: ['Cross', 'Suffering', 'Hope'],
    chorus: { lines: ['So I\'ll cherish the old rugged cross,', 'Till my trophies at last I lay down;', 'I will cling to the old rugged cross,', 'And exchange it some day for a crown.'] },
    verses: [
      { lines: ['On a hill far away stood an old rugged cross,', 'The emblem of suffering and shame;', 'And I love that old cross where the dearest and best', 'For a world of lost sinners was slain.'] },
      { lines: ['O that old rugged cross, so despised by the world,', 'Has a wondrous attraction for me;', 'For the dear Lamb of God left His glory above', 'To bear it to dark Calvary.'] },
      { lines: ['In that old rugged cross, stained with blood so divine,', 'A wondrous beauty I see,', 'For \'twas on that old cross Jesus suffered and died,', 'To pardon and sanctify me.'] },
      { lines: ['To the old rugged cross I will ever be true,', 'Its shame and reproach gladly bear;', 'Then He\'ll call me some day to my home far away,', 'Where His glory forever I\'ll share.'] },
    ],
  },

  {
    id: 'nothing-but-the-blood', number: 27, title: 'Nothing but the Blood', author: 'Robert Lowry',
    year: 1876, category: 'Grace & Salvation', featured: true,
    tags: ['Atonement', 'Cleansing', 'Blood of Christ'],
    chorus: { lines: ['O precious is the flow', 'That makes me white as snow;', 'No other fount I know,', 'Nothing but the blood of Jesus.'] },
    verses: [
      { lines: ['What can wash away my sin?', 'Nothing but the blood of Jesus;', 'What can make me whole again?', 'Nothing but the blood of Jesus.'] },
      { lines: ['For my pardon, this I see,', 'Nothing but the blood of Jesus;', 'For my cleansing this my plea,', 'Nothing but the blood of Jesus.'] },
      { lines: ['Nothing can for sin atone,', 'Nothing but the blood of Jesus;', 'Naught of good that I have done,', 'Nothing but the blood of Jesus.'] },
      { lines: ['This is all my hope and peace,', 'Nothing but the blood of Jesus;', 'This is all my righteousness,', 'Nothing but the blood of Jesus.'] },
    ],
  },

  {
    id: 'and-can-it-be', number: 28, title: 'And Can It Be That I Should Gain', author: 'Charles Wesley',
    year: 1738, category: 'Grace & Salvation', featured: false,
    tags: ['Redemption', 'Wonder', 'New Life'],
    verses: [
      { lines: ['And can it be that I should gain', 'An interest in the Savior\'s blood?', 'Died He for me, who caused His pain—', 'For me, who Him to death pursued?', 'Amazing love! How can it be', 'That Thou, my God, shouldst die for me?'] },
      { lines: ['\'Tis mystery all: th\'Immortal dies!', 'Who can explore His strange design?', 'In vain the firstborn seraph tries', 'To sound the depths of love divine.', '\'Tis mercy all! Let earth adore;', 'Let angel minds inquire no more.'] },
      { lines: ['He left His Father\'s throne above,', 'So free, so infinite His grace!', 'Emptied Himself of all but love,', 'And bled for Adam\'s helpless race.', '\'Tis mercy all, immense and free,', 'For, O my God, it found out me!'] },
      { lines: ['No condemnation now I dread;', 'Jesus, and all in Him, is mine!', 'Alive in Him, my living Head,', 'And clothed in righteousness divine,', 'Bold I approach th\'eternal throne,', 'And claim the crown, through Christ my own.'] },
    ],
  },

  {
    id: 'there-is-a-fountain', number: 29, title: 'There Is a Fountain', author: 'William Cowper',
    year: 1772, category: 'Grace & Salvation', featured: false,
    tags: ['Blood of Christ', 'Cleansing', 'Atonement'],
    verses: [
      { lines: ['There is a fountain filled with blood', 'Drawn from Emmanuel\'s veins;', 'And sinners plunged beneath that flood', 'Lose all their guilty stains.'] },
      { lines: ['The dying thief rejoiced to see', 'That fountain in his day;', 'And there have I, though vile as he,', 'Washed all my sins away.'] },
      { lines: ['Dear dying Lamb, Thy precious blood', 'Shall never lose its power', 'Till all the ransomed church of God', 'Be saved, to sin no more.'] },
      { lines: ['E\'er since, by faith, I saw the stream', 'Thy flowing wounds supply,', 'Redeeming love has been my theme,', 'And shall be till I die.'] },
      { lines: ['When this poor lisping, stammering tongue', 'Lies silent in the grave,', 'Then in a nobler, sweeter song,', 'I\'ll sing Thy power to save.'] },
    ],
  },

  {
    id: 'at-calvary', number: 30, title: 'At Calvary', author: 'William Newell',
    year: 1895, category: 'Grace & Salvation', featured: false,
    tags: ['Cross', 'Mercy', 'Testimony'],
    chorus: { lines: ['Mercy there was great, and grace was free;', 'Pardon there was multiplied to me;', 'There my burdened soul found liberty', 'At Calvary.'] },
    verses: [
      { lines: ['Years I spent in vanity and pride,', 'Caring not my Lord was crucified,', 'Knowing not it was for me He died', 'On Calvary.'] },
      { lines: ['By God\'s word at last my sin I learned;', 'Then I trembled at the law I\'d spurned,', 'Till my guilty soul imploring turned', 'To Calvary.'] },
      { lines: ['Now I\'ve giv\'n to Jesus everything,', 'Now I gladly own Him as my King,', 'Now my raptured soul can only sing', 'Of Calvary!'] },
      { lines: ['Oh, the love that drew salvation\'s plan!', 'Oh, the grace that brought it down to man!', 'Oh, the mighty gulf that God did span', 'At Calvary!'] },
    ],
  },

  // ── GRACE & SALVATION (cont.) ─────────────────────────────────────────────

  {
    id: 'jesus-paid-it-all', number: 31, title: 'Jesus Paid It All', author: 'Elvina Hall',
    year: 1865, category: 'Grace & Salvation', featured: false,
    tags: ['Atonement', 'Grace', 'Cleansing'],
    chorus: { lines: ['Jesus paid it all,', 'All to Him I owe;', 'Sin had left a crimson stain,', 'He washed it white as snow.'] },
    verses: [
      { lines: ['I hear the Savior say,', '"Thy strength indeed is small,', 'Child of weakness, watch and pray,', 'Find in Me thine all in all."'] },
      { lines: ['Lord, now indeed I find', 'Thy power, and Thine alone,', 'Can change the leper\'s spots', 'And melt the heart of stone.'] },
      { lines: ['For nothing good have I', 'Whereby Thy grace to claim;', 'I\'ll wash my garments white', 'In the blood of Calvary\'s Lamb.'] },
      { lines: ['And when before the throne', 'I stand in Him complete,', '"Jesus died my soul to save,"', 'My lips shall still repeat.'] },
    ],
  },

  {
    id: 'grace-greater-than-sin', number: 32, title: 'Grace Greater Than Our Sin', author: 'Julia Johnston',
    year: 1911, category: 'Grace & Salvation', featured: false,
    tags: ['Grace', 'Forgiveness', 'Redemption'],
    chorus: { lines: ['Grace, grace, God\'s grace,', 'Grace that will pardon and cleanse within;', 'Grace, grace, God\'s grace,', 'Grace that is greater than all our sin!'] },
    verses: [
      { lines: ['Marvelous grace of our loving Lord,', 'Grace that exceeds our sin and our guilt!', 'Yonder on Calvary\'s mount outpoured,', 'There where the blood of the Lamb was spilt.'] },
      { lines: ['Sin and despair, like the sea waves cold,', 'Threaten the soul with infinite loss;', 'Grace that is greater, yes, grace untold,', 'Points to the refuge, the mighty cross.'] },
      { lines: ['Dark is the stain that we cannot hide;', 'What can avail to wash it away?', 'Look! there is flowing a crimson tide,', 'Brighter than snow you may be today.'] },
      { lines: ['Marvelous, infinite, matchless grace,', 'Freely bestowed on all who believe!', 'You that are longing to see His face,', 'Will you this moment His grace receive?'] },
    ],
  },

  {
    id: 'there-is-power-in-blood', number: 33, title: 'There Is Power in the Blood', author: 'Lewis Jones',
    year: 1899, category: 'Grace & Salvation', featured: false,
    tags: ['Blood of Christ', 'Power', 'Cleansing'],
    chorus: { lines: ['There is power, power, wonder-working power', 'In the blood of the Lamb;', 'There is power, power, wonder-working power', 'In the precious blood of the Lamb.'] },
    verses: [
      { lines: ['Would you be free from the burden of sin?', 'There\'s power in the blood, power in the blood;', 'Would you o\'er evil a victory win?', 'There\'s wonderful power in the blood.'] },
      { lines: ['Would you be free from your passion and pride?', 'There\'s power in the blood, power in the blood;', 'Come for a cleansing to Calvary\'s tide;', 'There\'s wonderful power in the blood.'] },
      { lines: ['Would you be whiter, much whiter than snow?', 'There\'s power in the blood, power in the blood;', 'Sin stains are lost in its life-giving flow;', 'There\'s wonderful power in the blood.'] },
      { lines: ['Would you do service for Jesus your King?', 'There\'s power in the blood, power in the blood;', 'Would you live daily His praises to sing?', 'There\'s wonderful power in the blood.'] },
    ],
  },

  {
    id: 'the-solid-rock', number: 34, title: 'The Solid Rock', author: 'Edward Mote',
    year: 1834, category: 'Grace & Salvation', featured: false,
    tags: ['Foundation', 'Christ', 'Assurance'],
    chorus: { lines: ['On Christ, the solid rock, I stand;', 'All other ground is sinking sand,', 'All other ground is sinking sand.'] },
    verses: [
      { lines: ['My hope is built on nothing less', 'Than Jesus\' blood and righteousness;', 'I dare not trust the sweetest frame,', 'But wholly lean on Jesus\' name.'] },
      { lines: ['When darkness veils His lovely face,', 'I rest on His unchanging grace;', 'In every high and stormy gale,', 'My anchor holds within the veil.'] },
      { lines: ['His oath, His covenant, His blood', 'Support me in the whelming flood;', 'When all around my soul gives way,', 'He then is all my hope and stay.'] },
      { lines: ['When He shall come with trumpet sound,', 'O may I then in Him be found;', 'Dressed in His righteousness alone,', 'Faultless to stand before the throne.'] },
    ],
  },

  {
    id: 'man-of-sorrows', number: 35, title: 'Man of Sorrows', author: 'Philip Bliss',
    year: 1875, category: 'Grace & Salvation', featured: false,
    tags: ['Cross', 'Suffering', 'Resurrection'],
    chorus: { lines: ['Hallelujah! what a Savior!', 'Hallelujah! what a Friend!', 'Saving, helping, keeping, loving,', 'He is with me to the end.'] },
    verses: [
      { lines: ['"Man of Sorrows!" what a name', 'For the Son of God, who came', 'Ruined sinners to reclaim!', 'Hallelujah! what a Savior!'] },
      { lines: ['Bearing shame and scoffing rude,', 'In my place condemned He stood;', 'Sealed my pardon with His blood;', 'Hallelujah! what a Savior!'] },
      { lines: ['Guilty, vile, and helpless we;', 'Spotless Lamb of God was He;', '"Full atonement!" can it be?', 'Hallelujah! what a Savior!'] },
      { lines: ['Lifted up was He to die,', '"It is finished!" was His cry;', 'Now in heaven exalted high;', 'Hallelujah! what a Savior!'] },
      { lines: ['When He comes, our glorious King,', 'All His ransomed home to bring,', 'Then anew this song we\'ll sing:', 'Hallelujah! what a Savior!'] },
    ],
  },

  // ── FAITH & TRUST ─────────────────────────────────────────────────────────

  {
    id: 'a-mighty-fortress', number: 36, title: 'A Mighty Fortress Is Our God', author: 'Martin Luther',
    year: 1529, category: 'Faith & Trust', featured: true,
    tags: ['Strength', 'Refuge', 'Reformation'],
    verses: [
      { lines: ['A mighty fortress is our God,', 'A bulwark never failing;', 'Our helper He, amid the flood', 'Of mortal ills prevailing.', 'For still our ancient foe', 'Doth seek to work us woe;', 'His craft and power are great,', 'And armed with cruel hate,', 'On earth is not his equal.'] },
      { lines: ['Did we in our own strength confide,', 'Our striving would be losing,', 'Were not the right Man on our side,', 'The Man of God\'s own choosing.', 'Dost ask who that may be?', 'Christ Jesus, it is He;', 'Lord Sabaoth, His name,', 'From age to age the same,', 'And He must win the battle.'] },
      { lines: ['And though this world, with devils filled,', 'Should threaten to undo us,', 'We will not fear, for God hath willed', 'His truth to triumph through us.', 'The Prince of Darkness grim,', 'We tremble not for him;', 'His rage we can endure,', 'For lo, his doom is sure;', 'One little word shall fell him.'] },
      { lines: ['That word above all earthly powers,', 'No thanks to them, abideth;', 'The Spirit and the gifts are ours', 'Through Him who with us sideth.', 'Let goods and kindred go,', 'This mortal life also;', 'The body they may kill;', 'God\'s truth abideth still,', 'His kingdom is forever.'] },
    ],
  },

  {
    id: 'be-thou-my-vision', number: 37, title: 'Be Thou My Vision', author: 'Irish Hymn (tr. Mary Byrne)',
    year: 700, category: 'Faith & Trust', featured: true,
    tags: ['Devotion', 'Vision', 'Surrender'],
    verses: [
      { lines: ['Be Thou my Vision, O Lord of my heart;', 'Naught be all else to me, save that Thou art.', 'Thou my best Thought, by day or by night,', 'Waking or sleeping, Thy presence my light.'] },
      { lines: ['Be Thou my Wisdom, and Thou my true Word;', 'I ever with Thee and Thou with me, Lord;', 'Thou my great Father, I Thy true son;', 'Thou in me dwelling, and I with Thee one.'] },
      { lines: ['Be Thou my battle Shield, Sword for the fight;', 'Be Thou my Dignity, Thou my Delight;', 'Thou my soul\'s Shelter, Thou my high Tow\'r:', 'Raise Thou me heav\'nward, O Pow\'r of my pow\'r.'] },
      { lines: ['Riches I heed not, nor man\'s empty praise,', 'Thou mine Inheritance, now and always:', 'Thou and Thou only, first in my heart,', 'High King of Heaven, my Treasure Thou art.'] },
      { lines: ['High King of Heaven, my victory won,', 'May I reach Heaven\'s joys, O bright Heaven\'s Sun!', 'Heart of my own heart, whatever befall,', 'Still be my Vision, O Ruler of all.'] },
    ],
  },

  {
    id: 'come-thou-fount', number: 38, title: 'Come, Thou Fount of Every Blessing', author: 'Robert Robinson',
    year: 1758, category: 'Faith & Trust', featured: true,
    tags: ['Grace', 'Praise', 'Wandering'],
    verses: [
      { lines: ['Come, Thou Fount of every blessing,', 'Tune my heart to sing Thy grace;', 'Streams of mercy, never ceasing,', 'Call for songs of loudest praise.', 'Teach me some melodious sonnet,', 'Sung by flaming tongues above;', 'Praise the mount, I\'m fixed upon it,', 'Mount of Thy redeeming love.'] },
      { lines: ['Here I raise my Ebenezer;', 'Hither by Thy help I\'m come;', 'And I hope, by Thy good pleasure,', 'Safely to arrive at home.', 'Jesus sought me when a stranger,', 'Wandering from the fold of God;', 'He, to rescue me from danger,', 'Interposed His precious blood.'] },
      { lines: ['O to grace how great a debtor', 'Daily I\'m constrained to be!', 'Let Thy goodness, like a fetter,', 'Bind my wandering heart to Thee.', 'Prone to wander, Lord, I feel it,', 'Prone to leave the God I love;', 'Here\'s my heart, O take and seal it,', 'Seal it for Thy courts above.'] },
    ],
  },

  {
    id: 'how-firm-a-foundation', number: 39, title: 'How Firm a Foundation', author: 'George Keith',
    year: 1787, category: 'Faith & Trust', featured: true,
    tags: ['Promises', 'Steadfastness', 'Scripture'],
    verses: [
      { lines: ['How firm a foundation, ye saints of the Lord,', 'Is laid for your faith in His excellent word!', 'What more can He say than to you He hath said,', 'You who unto Jesus for refuge have fled?'] },
      { lines: ['"Fear not, I am with thee, O be not dismayed,', 'For I am thy God and will still give thee aid;', 'I\'ll strengthen and help thee, and cause thee to stand,', 'Upheld by My righteous, omnipotent hand."'] },
      { lines: ['"When through the deep waters I call thee to go,', 'The rivers of woe shall not thee overflow;', 'For I will be with thee, thy troubles to bless,', 'And sanctify to thee thy deepest distress."'] },
      { lines: ['"When through fiery trials thy pathway shall lie,', 'My grace, all sufficient, shall be thy supply;', 'The flame shall not hurt thee; I only design', 'Thy dross to consume, and thy gold to refine."'] },
      { lines: ['The soul that on Jesus has leaned for repose,', 'I will not, I will not desert to its foes;', 'That soul, though all hell should endeavor to shake,', 'I\'ll never, no never, no never forsake!'] },
    ],
  },

  {
    id: 'o-god-our-help', number: 40, title: 'O God, Our Help in Ages Past', author: 'Isaac Watts',
    year: 1719, category: 'Faith & Trust', featured: false,
    tags: ['Eternity', 'Refuge', 'Time'],
    verses: [
      { lines: ['O God, our help in ages past,', 'Our hope for years to come,', 'Our shelter from the stormy blast,', 'And our eternal home.'] },
      { lines: ['Under the shadow of Thy throne', 'Thy saints have dwelt secure;', 'Sufficient is Thine arm alone,', 'And our defense is sure.'] },
      { lines: ['Before the hills in order stood,', 'Or earth received her frame,', 'From everlasting Thou art God,', 'To endless years the same.'] },
      { lines: ['A thousand ages in Thy sight', 'Are like an evening gone;', 'Short as the watch that ends the night', 'Before the rising sun.'] },
      { lines: ['O God, our help in ages past,', 'Our hope for years to come,', 'Be Thou our guard while troubles last,', 'And our eternal home.'] },
    ],
  },

  {
    id: 'leaning-on-arms', number: 41, title: 'Leaning on the Everlasting Arms', author: 'Elisha Hoffman',
    year: 1887, category: 'Faith & Trust', featured: true,
    tags: ['Security', 'Peace', 'Trust'],
    chorus: { lines: ['Leaning, leaning,', 'Safe and secure from all alarms;', 'Leaning, leaning,', 'Leaning on the everlasting arms.'] },
    verses: [
      { lines: ['What a fellowship, what a joy divine,', 'Leaning on the everlasting arms;', 'What a blessedness, what a peace is mine,', 'Leaning on the everlasting arms.'] },
      { lines: ['Oh, how sweet to walk in this pilgrim way,', 'Leaning on the everlasting arms;', 'Oh, how bright the path grows from day to day,', 'Leaning on the everlasting arms.'] },
      { lines: ['What have I to dread, what have I to fear,', 'Leaning on the everlasting arms;', 'I have blessed peace with my Lord so near,', 'Leaning on the everlasting arms.'] },
    ],
  },

  {
    id: 'my-faith-looks-up', number: 42, title: 'My Faith Looks Up to Thee', author: 'Ray Palmer',
    year: 1830, category: 'Faith & Trust', featured: false,
    tags: ['Faith', 'Prayer', 'Devotion'],
    verses: [
      { lines: ['My faith looks up to Thee,', 'Thou Lamb of Calvary,', 'Savior divine!', 'Now hear me while I pray,', 'Take all my guilt away,', 'O let me from this day', 'Be wholly Thine!'] },
      { lines: ['May Thy rich grace impart', 'Strength to my fainting heart,', 'My zeal inspire;', 'As Thou hast died for me,', 'O may my love to Thee', 'Pure, warm, and changeless be,', 'A living fire!'] },
      { lines: ['While life\'s dark maze I tread,', 'And griefs around me spread,', 'Be Thou my guide;', 'Bid darkness turn to day,', 'Wipe sorrow\'s tears away,', 'Nor let me ever stray', 'From Thee aside.'] },
      { lines: ['When ends life\'s transient dream,', 'When death\'s cold, sullen stream', 'Shall o\'er me roll,', 'Blest Savior, then in love,', 'Fear and distrust remove;', 'O bear me safe above,', 'A ransomed soul!'] },
    ],
  },

  {
    id: 'turn-your-eyes', number: 43, title: 'Turn Your Eyes upon Jesus', author: 'Helen Lemmel',
    year: 1922, category: 'Faith & Trust', featured: false,
    tags: ['Focus', 'Jesus', 'Surrender'],
    chorus: { lines: ['Turn your eyes upon Jesus,', 'Look full in His wonderful face,', 'And the things of earth will grow strangely dim,', 'In the light of His glory and grace.'] },
    verses: [
      { lines: ['O soul, are you weary and troubled?', 'No light in the darkness you see?', 'There\'s light for a look at the Savior,', 'And life more abundant and free!'] },
      { lines: ['Through death into life everlasting', 'He passed, and we follow Him there;', 'O\'er us sin no more hath dominion—', 'For more than conquerors we are!'] },
      { lines: ['His Word shall not fail you—He promised;', 'Believe Him, and all will be well:', 'Then go to a world that is dying,', 'His perfect salvation to tell!'] },
    ],
  },

  {
    id: 'standing-on-promises', number: 44, title: 'Standing on the Promises', author: 'Russell Carter',
    year: 1886, category: 'Faith & Trust', featured: false,
    tags: ['Promises', 'Scripture', 'Victory'],
    chorus: { lines: ['Standing, standing,', 'Standing on the promises of God my Savior;', 'Standing, standing,', 'I\'m standing on the promises of God.'] },
    verses: [
      { lines: ['Standing on the promises of Christ my King,', 'Through eternal ages let His praises ring;', 'Glory in the highest, I will shout and sing,', 'Standing on the promises of God.'] },
      { lines: ['Standing on the promises that cannot fail,', 'When the howling storms of doubt and fear assail,', 'By the living Word of God I shall prevail,', 'Standing on the promises of God.'] },
      { lines: ['Standing on the promises of Christ the Lord,', 'Bound to Him eternally by love\'s strong cord,', 'Overcoming daily with the Spirit\'s sword,', 'Standing on the promises of God.'] },
      { lines: ['Standing on the promises I cannot fall,', 'List\'ning every moment to the Spirit\'s call,', 'Resting in my Savior as my all in all,', 'Standing on the promises of God.'] },
    ],
  },

  {
    id: 'trust-and-obey', number: 45, title: 'Trust and Obey', author: 'John Sammis',
    year: 1887, category: 'Faith & Trust', featured: false,
    tags: ['Obedience', 'Faith', 'Joy'],
    chorus: { lines: ['Trust and obey,', 'For there\'s no other way', 'To be happy in Jesus,', 'But to trust and obey.'] },
    verses: [
      { lines: ['When we walk with the Lord', 'In the light of His word,', 'What a glory He sheds on our way!', 'While we do His good will,', 'He abides with us still,', 'And with all who will trust and obey.'] },
      { lines: ['Not a shadow can rise,', 'Not a cloud in the skies,', 'But His smile quickly drives it away;', 'Not a doubt or a fear,', 'Not a sigh or a tear,', 'Can abide while we trust and obey.'] },
      { lines: ['Not a burden we bear,', 'Not a sorrow we share,', 'But our toil He doth richly repay;', 'Not a grief or a loss,', 'Not a frown or a cross,', 'But is blest if we trust and obey.'] },
      { lines: ['But we never can prove', 'The delights of His love', 'Until all on the altar we lay;', 'For the favor He shows,', 'For the joy He bestows,', 'Are for them who will trust and obey.'] },
    ],
  },

  // ── FAITH & TRUST (cont.) ─────────────────────────────────────────────────

  {
    id: 'day-by-day', number: 46, title: 'Day by Day', author: 'Lina Sandell',
    year: 1865, category: 'Faith & Trust', featured: false,
    tags: ['Daily Walk', 'Providence', 'Peace'],
    verses: [
      { lines: ['Day by day and with each passing moment,', 'Strength I find to meet my trials here;', 'Trusting in my Father\'s wise bestowment,', 'I\'ve no cause for worry or for fear.', 'He whose heart is kind beyond all measure', 'Gives unto each day what He deems best—', 'Lovingly, its part of pain and pleasure,', 'Mingling toil with peace and rest.'] },
      { lines: ['Every day the Lord Himself is near me', 'With a special mercy for each hour;', 'All my cares He fain would bear, and cheer me,', 'He whose name is Counselor and Power.', 'The protection of His child and treasure', 'Is a charge that on Himself He laid;', '\'As thy days, thy strength shall be in measure,\'', 'This the pledge to me He made.'] },
      { lines: ['Help me then in every tribulation', 'So to trust Thy promises, O Lord,', 'That I lose not faith\'s sweet consolation', 'Offered me within Thy holy Word.', 'Help me, Lord, when toil and trouble meeting,', 'E\'er to take, as from a father\'s hand,', 'One by one, the days, the moments fleeting,', 'Till I reach the promised land.'] },
    ],
  },

  {
    id: 'i-know-whom-i-believed', number: 47, title: 'I Know Whom I Have Believed', author: 'Daniel Whittle',
    year: 1883, category: 'Faith & Trust', featured: false,
    tags: ['Assurance', 'Faith', 'Eternal Life'],
    chorus: { lines: ['But I know whom I have believed,', 'And am persuaded that He is able', 'To keep that which I\'ve committed', 'Unto Him against that day.'] },
    verses: [
      { lines: ['I know not why God\'s wondrous grace', 'To me He hath made known,', 'Nor why, unworthy, Christ in love', 'Redeemed me for His own.'] },
      { lines: ['I know not how this saving faith', 'To me He did impart,', 'Nor how believing in His Word', 'Wrought peace within my heart.'] },
      { lines: ['I know not how the Spirit moves,', 'Convincing men of sin,', 'Revealing Jesus through the Word,', 'Creating faith in Him.'] },
      { lines: ['I know not what of good or ill', 'May be reserved for me,', 'Of weary ways or golden days,', 'Before His face I see.'] },
    ],
  },

  {
    id: 'he-leadeth-me', number: 48, title: 'He Leadeth Me', author: 'Joseph Gilmore',
    year: 1862, category: 'Faith & Trust', featured: false,
    tags: ['Guidance', 'Shepherding', 'Trust'],
    chorus: { lines: ['He leadeth me, He leadeth me,', 'By His own hand He leadeth me;', 'His faithful follower I would be,', 'For by His hand He leadeth me.'] },
    verses: [
      { lines: ['He leadeth me! O blessed thought!', 'O words with heavenly comfort fraught!', 'Whate\'er I do, where\'er I be,', 'Still \'tis God\'s hand that leadeth me.'] },
      { lines: ['Sometimes \'mid scenes of deepest gloom,', 'Sometimes where Eden\'s bowers bloom,', 'By waters still, o\'er troubled sea,', 'Still \'tis His hand that leadeth me.'] },
      { lines: ['Lord, I would place my hand in Thine,', 'Nor ever murmur nor repine;', 'Content, whatever lot I see,', 'Since \'tis my God that leadeth me.'] },
      { lines: ['And when my task on earth is done,', 'When by Thy grace the victory\'s won,', 'E\'en death\'s cold wave I will not flee,', 'Since God through Jordan leadeth me.'] },
    ],
  },

  {
    id: 'like-a-river-glorious', number: 49, title: 'Like a River Glorious', author: 'Frances Havergal',
    year: 1876, category: 'Faith & Trust', featured: false,
    tags: ['Peace', 'Surrender', 'Trust'],
    chorus: { lines: ['Stayed upon Jehovah,', 'Hearts are fully blest;', 'Finding, as He promised,', 'Perfect peace and rest.'] },
    verses: [
      { lines: ['Like a river glorious', 'Is God\'s perfect peace,', 'Over all victorious', 'In its bright increase;', 'Perfect, yet it floweth', 'Fuller every day,', 'Perfect, yet it groweth', 'Deeper all the way.'] },
      { lines: ['Hidden in the hollow', 'Of His blessed hand,', 'Never foe can follow,', 'Never traitor stand;', 'Not a surge of worry,', 'Not a shade of care,', 'Not a blast of hurry', 'Touch the spirit there.'] },
      { lines: ['Every joy or trial', 'Falleth from above,', 'Traced upon our dial', 'By the Sun of Love.', 'We may trust Him fully', 'All for us to do;', 'They who trust Him wholly', 'Find Him wholly true.'] },
    ],
  },

  {
    id: 'under-his-wings', number: 50, title: 'Under His Wings', author: 'William Cushing',
    year: 1896, category: 'Faith & Trust', featured: false,
    tags: ['Refuge', 'Protection', 'Shelter'],
    chorus: { lines: ['Under His wings, under His wings,', 'Who from His love can sever?', 'Under His wings my soul shall abide,', 'Safely abide forever.'] },
    verses: [
      { lines: ['Under His wings I am safely abiding,', 'Though the night deepens and tempests are wild,', 'Still I can trust Him; I know He will keep me,', 'He has redeemed me, and I am His child.'] },
      { lines: ['Under His wings, what a refuge in sorrow!', 'How the heart yearningly turns to His rest!', 'Often when earth has no balm for my healing,', 'There I find comfort, and there I am blest.'] },
      { lines: ['Under His wings, O what precious enjoyment!', 'There will I hide till life\'s trials are o\'er;', 'Sheltered, protected, no evil can harm me,', 'Resting in Jesus, I\'m safe evermore.'] },
    ],
  },

  // ── PRAYER & DEVOTION ─────────────────────────────────────────────────────

  {
    id: 'what-a-friend', number: 51, title: 'What a Friend We Have in Jesus', author: 'Joseph Scriven',
    year: 1855, category: 'Prayer & Devotion', featured: true,
    tags: ['Prayer', 'Friendship', 'Peace'],
    verses: [
      { lines: ['What a friend we have in Jesus,', 'All our sins and griefs to bear!', 'What a privilege to carry', 'Everything to God in prayer!', 'O what peace we often forfeit,', 'O what needless pain we bear,', 'All because we do not carry', 'Everything to God in prayer!'] },
      { lines: ['Have we trials and temptations?', 'Is there trouble anywhere?', 'We should never be discouraged;', 'Take it to the Lord in prayer.', 'Can we find a friend so faithful', 'Who will all our sorrows share?', 'Jesus knows our every weakness;', 'Take it to the Lord in prayer.'] },
      { lines: ['Are we weak and heavy laden,', 'Cumbered with a load of care?', 'Precious Savior, still our refuge,', 'Take it to the Lord in prayer.', 'Do thy friends despise, forsake thee?', 'Take it to the Lord in prayer!', 'In His arms He\'ll take and shield thee,', 'Thou wilt find a solace there.'] },
    ],
  },

  {
    id: 'abide-with-me', number: 52, title: 'Abide with Me', author: 'Henry Lyte',
    year: 1847, category: 'Prayer & Devotion', featured: true,
    tags: ['Evening', 'Death', 'Comfort'],
    verses: [
      { lines: ['Abide with me; fast falls the eventide;', 'The darkness deepens; Lord, with me abide.', 'When other helpers fail and comforts flee,', 'Help of the helpless, O abide with me.'] },
      { lines: ['Swift to its close ebbs out life\'s little day;', 'Earth\'s joys grow dim; its glories pass away;', 'Change and decay in all around I see;', 'O Thou who changest not, abide with me.'] },
      { lines: ['I need Thy presence every passing hour.', 'What but Thy grace can foil the tempter\'s power?', 'Who, like Thyself, my guide and stay can be?', 'Through cloud and sunshine, Lord, abide with me.'] },
      { lines: ['I fear no foe, with Thee at hand to bless;', 'Ills have no weight, and tears no bitterness.', 'Where is death\'s sting? Where, grave, thy victory?', 'I triumph still, if Thou abide with me.'] },
      { lines: ['Hold Thou Thy cross before my closing eyes;', 'Shine through the gloom and point me to the skies.', 'Heaven\'s morning breaks, and earth\'s vain shadows flee;', 'In life, in death, O Lord, abide with me.'] },
    ],
  },

  {
    id: 'sweet-hour-of-prayer', number: 53, title: 'Sweet Hour of Prayer', author: 'William Walford',
    year: 1845, category: 'Prayer & Devotion', featured: false,
    tags: ['Prayer', 'Communion', 'Devotion'],
    verses: [
      { lines: ['Sweet hour of prayer! Sweet hour of prayer!', 'That calls me from a world of care,', 'And bids me at my Father\'s throne', 'Make all my wants and wishes known.', 'In seasons of distress and grief,', 'My soul has often found relief,', 'And oft escaped the tempter\'s snare', 'By thy return, sweet hour of prayer!'] },
      { lines: ['Sweet hour of prayer! Sweet hour of prayer!', 'The joys I feel, the bliss I share,', 'Of those whose anxious spirits burn', 'With strong desires for thy return!', 'With such I hasten to the place', 'Where God my Savior shows His face,', 'And gladly take my station there,', 'And wait for thee, sweet hour of prayer!'] },
      { lines: ['Sweet hour of prayer! Sweet hour of prayer!', 'Thy wings shall my petition bear', 'To Him whose truth and faithfulness', 'Engage the waiting soul to bless.', 'And since He bids me seek His face,', 'Believe His word and trust His grace,', 'I\'ll cast on Him my every care,', 'And wait for thee, sweet hour of prayer!'] },
    ],
  },

  {
    id: 'take-my-life', number: 54, title: 'Take My Life and Let It Be', author: 'Frances Havergal',
    year: 1874, category: 'Prayer & Devotion', featured: false,
    tags: ['Consecration', 'Surrender', 'Devotion'],
    verses: [
      { lines: ['Take my life, and let it be', 'Consecrated, Lord, to Thee;', 'Take my moments and my days,', 'Let them flow in ceaseless praise.'] },
      { lines: ['Take my hands, and let them move', 'At the impulse of Thy love;', 'Take my feet, and let them be', 'Swift and beautiful for Thee.'] },
      { lines: ['Take my voice, and let me sing', 'Always, only, for my King;', 'Take my lips, and let them be', 'Filled with messages from Thee.'] },
      { lines: ['Take my silver and my gold;', 'Not a mite would I withhold;', 'Take my intellect, and use', 'Every power as Thou shalt choose.'] },
      { lines: ['Take my will, and make it Thine;', 'It shall be no longer mine.', 'Take my heart, it is Thine own;', 'It shall be Thy royal throne.'] },
      { lines: ['Take my love; my Lord, I pour', 'At Thy feet its treasure-store.', 'Take myself, and I will be', 'Ever, only, all for Thee.'] },
    ],
  },

  {
    id: 'nearer-my-god', number: 55, title: 'Nearer, My God, to Thee', author: 'Sarah Adams',
    year: 1841, category: 'Prayer & Devotion', featured: false,
    tags: ['Devotion', 'Drawing Near', 'Worship'],
    chorus: { lines: ['Nearer, my God, to Thee,', 'Nearer to Thee!'] },
    verses: [
      { lines: ['Nearer, my God, to Thee,', 'Nearer to Thee!', 'E\'en though it be a cross', 'That raiseth me;', 'Still all my song shall be,', 'Nearer, my God, to Thee,', 'Nearer, my God, to Thee,', 'Nearer to Thee!'] },
      { lines: ['Though like the wanderer,', 'The sun gone down,', 'Darkness be over me,', 'My rest a stone;', 'Yet in my dreams I\'d be', 'Nearer, my God, to Thee,', 'Nearer, my God, to Thee,', 'Nearer to Thee!'] },
      { lines: ['There let the way appear,', 'Steps unto heaven;', 'All that Thou sendest me,', 'In mercy given;', 'Angels to beckon me', 'Nearer, my God, to Thee,', 'Nearer, my God, to Thee,', 'Nearer to Thee!'] },
      { lines: ['Or if, on joyful wing', 'Cleaving the sky,', 'Sun, moon, and stars forgot,', 'Upward I fly,', 'Still all my song shall be,', 'Nearer, my God, to Thee,', 'Nearer, my God, to Thee,', 'Nearer to Thee!'] },
    ],
  },

  {
    id: 'more-love-to-thee', number: 56, title: 'More Love to Thee', author: 'Elizabeth Prentiss',
    year: 1856, category: 'Prayer & Devotion', featured: false,
    tags: ['Love', 'Devotion', 'Prayer'],
    chorus: { lines: ['More love, O Christ, to Thee,', 'More love to Thee!', 'More love to Thee!'] },
    verses: [
      { lines: ['More love to Thee, O Christ,', 'More love to Thee!', 'Hear Thou the prayer I make', 'On bended knee.', 'This is my earnest plea:', 'More love, O Christ, to Thee,', 'More love to Thee,', 'More love to Thee!'] },
      { lines: ['Once earthly joy I craved,', 'Sought peace and rest;', 'Now Thee alone I seek,', 'Give what is best.', 'This all my prayer shall be:', 'More love, O Christ, to Thee,', 'More love to Thee,', 'More love to Thee!'] },
      { lines: ['Then shall my latest breath', 'Whisper Thy praise;', 'This be the parting cry', 'My heart shall raise;', 'This still its prayer shall be:', 'More love, O Christ, to Thee,', 'More love to Thee,', 'More love to Thee!'] },
    ],
  },

  {
    id: 'i-need-thee-every-hour', number: 57, title: 'I Need Thee Every Hour', author: 'Annie Hawks',
    year: 1872, category: 'Prayer & Devotion', featured: false,
    tags: ['Dependence', 'Prayer', 'Devotion'],
    chorus: { lines: ['I need Thee, O I need Thee;', 'Every hour I need Thee!', 'O bless me now, my Savior,', 'I come to Thee.'] },
    verses: [
      { lines: ['I need Thee every hour,', 'Most gracious Lord;', 'No tender voice like Thine', 'Can peace afford.'] },
      { lines: ['I need Thee every hour,', 'Stay Thou nearby;', 'Temptations lose their power', 'When Thou art nigh.'] },
      { lines: ['I need Thee every hour,', 'In joy or pain;', 'Come quickly and abide,', 'Or life is vain.'] },
      { lines: ['I need Thee every hour,', 'Most Holy One;', 'O make me Thine indeed,', 'Thou blessed Son.'] },
    ],
  },

  {
    id: 'have-thine-own-way', number: 58, title: 'Have Thine Own Way, Lord', author: 'Adelaide Pollard',
    year: 1907, category: 'Prayer & Devotion', featured: false,
    tags: ['Surrender', 'Potter', 'Consecration'],
    verses: [
      { lines: ['Have Thine own way, Lord! Have Thine own way!', 'Thou art the Potter, I am the clay.', 'Mold me and make me after Thy will,', 'While I am waiting, yielded and still.'] },
      { lines: ['Have Thine own way, Lord! Have Thine own way!', 'Search me and try me, Master, today!', 'Whiter than snow, Lord, wash me just now,', 'As in Thy presence humbly I bow.'] },
      { lines: ['Have Thine own way, Lord! Have Thine own way!', 'Wounded and weary, help me, I pray!', 'Power, all power, surely is Thine!', 'Touch me and heal me, Savior divine!'] },
      { lines: ['Have Thine own way, Lord! Have Thine own way!', 'Hold o\'er my being absolute sway!', 'Fill with Thy Spirit till all shall see', 'Christ only, always, living in me!'] },
    ],
  },

  {
    id: 'near-to-the-heart-of-god', number: 59, title: 'Near to the Heart of God', author: 'Cleland McAfee',
    year: 1903, category: 'Prayer & Devotion', featured: false,
    tags: ['Refuge', 'Comfort', 'Rest'],
    chorus: { lines: ['O Jesus, blest Redeemer,', 'Sent from the heart of God,', 'Hold us who wait before Thee', 'Near to the heart of God.'] },
    verses: [
      { lines: ['There is a place of quiet rest,', 'Near to the heart of God;', 'A place where sin cannot molest,', 'Near to the heart of God.'] },
      { lines: ['There is a place of comfort sweet,', 'Near to the heart of God;', 'A place where we our Savior meet,', 'Near to the heart of God.'] },
      { lines: ['There is a place of full release,', 'Near to the heart of God;', 'A place where all is joy and peace,', 'Near to the heart of God.'] },
    ],
  },

  {
    id: 'o-jesus-i-have-promised', number: 60, title: 'O Jesus, I Have Promised', author: 'John Bode',
    year: 1866, category: 'Prayer & Devotion', featured: false,
    tags: ['Commitment', 'Discipleship', 'Devotion'],
    verses: [
      { lines: ['O Jesus, I have promised', 'To serve Thee to the end;', 'Be Thou forever near me,', 'My Master and my Friend.', 'I shall not fear the battle', 'If Thou art by my side,', 'Nor wander from the pathway', 'If Thou wilt be my guide.'] },
      { lines: ['O let me feel Thee near me!', 'The world is ever near;', 'I see the sights that dazzle,', 'The tempting sounds I hear;', 'My foes are ever near me,', 'Around me and within;', 'But Jesus, draw Thou nearer,', 'And shield my soul from sin.'] },
      { lines: ['O let me hear Thee speaking', 'In accents clear and still,', 'Above the storms of passion,', 'The murmurs of self-will;', 'O speak to reassure me,', 'To hasten or control;', 'O speak, and make me listen,', 'Thou guardian of my soul.'] },
      { lines: ['O Jesus, Thou hast promised', 'To all who follow Thee', 'That where Thou art in glory', 'There shall Thy servant be;', 'And, Jesus, I have promised', 'To serve Thee to the end;', 'O give me grace to follow,', 'My Master and my Friend.'] },
    ],
  },

  // ── PRAYER & DEVOTION (cont.) ─────────────────────────────────────────────

  {
    id: 'softly-and-tenderly', number: 61, title: 'Softly and Tenderly', author: 'Will Thompson',
    year: 1880, category: 'Prayer & Devotion', featured: false,
    tags: ['Invitation', 'Mercy', 'Return'],
    chorus: { lines: ['Come home, come home,', 'Ye who are weary, come home;', 'Earnestly, tenderly, Jesus is calling,', 'Calling, O sinner, come home!'] },
    verses: [
      { lines: ['Softly and tenderly Jesus is calling,', 'Calling for you and for me;', 'See, on the portals He\'s waiting and watching,', 'Watching for you and for me.'] },
      { lines: ['Why should we tarry when Jesus is pleading,', 'Pleading for you and for me?', 'Why should we linger and heed not His mercies,', 'Mercies for you and for me?'] },
      { lines: ['Time is now fleeting, the moments are passing,', 'Passing from you and from me;', 'Shadows are gathering, deathbeds are coming,', 'Coming for you and for me.'] },
      { lines: ['O for the wonderful love He has promised,', 'Promised for you and for me!', 'Though we have sinned, He has mercy and pardon,', 'Pardon for you and for me.'] },
    ],
  },

  {
    id: 'god-will-take-care', number: 62, title: 'God Will Take Care of You', author: 'Civilla Martin',
    year: 1904, category: 'Prayer & Devotion', featured: false,
    tags: ['Providence', 'Trust', 'Care'],
    chorus: { lines: ['God will take care of you,', 'Through every day, o\'er all the way;', 'He will take care of you,', 'God will take care of you.'] },
    verses: [
      { lines: ['Be not dismayed whate\'er betide,', 'God will take care of you;', 'Beneath His wings of love abide,', 'God will take care of you.'] },
      { lines: ['Through days of toil when heart doth fail,', 'God will take care of you;', 'When dangers fierce your path assail,', 'God will take care of you.'] },
      { lines: ['All you may need He will provide,', 'God will take care of you;', 'Nothing you ask will be denied,', 'God will take care of you.'] },
      { lines: ['No matter what may be the test,', 'God will take care of you;', 'Lean, weary one, upon His breast,', 'God will take care of you.'] },
    ],
  },

  {
    id: 'in-the-garden', number: 63, title: 'In the Garden', author: 'C. Austin Miles',
    year: 1912, category: 'Prayer & Devotion', featured: false,
    tags: ['Communion', 'Walking with Jesus', 'Joy'],
    chorus: { lines: ['And He walks with me, and He talks with me,', 'And He tells me I am His own;', 'And the joy we share as we tarry there,', 'None other has ever known.'] },
    verses: [
      { lines: ['I come to the garden alone,', 'While the dew is still on the roses,', 'And the voice I hear falling on my ear', 'The Son of God discloses.'] },
      { lines: ['He speaks, and the sound of His voice', 'Is so sweet the birds hush their singing,', 'And the melody that He gave to me', 'Within my heart is ringing.'] },
      { lines: ['I\'d stay in the garden with Him', 'Though the night around me be falling,', 'But He bids me go; through the voice of woe', 'His voice to me is calling.'] },
    ],
  },

  // ── GOD'S LOVE ────────────────────────────────────────────────────────────

  {
    id: 'o-love-that-will-not-let-me-go', number: 64, title: "O Love That Will Not Let Me Go", author: 'George Matheson',
    year: 1882, category: "God's Love", featured: true,
    tags: ['Love', 'Hope', 'Rest'],
    verses: [
      { lines: ['O Love that wilt not let me go,', 'I rest my weary soul in Thee;', 'I give Thee back the life I owe,', 'That in Thine ocean depths its flow', 'May richer, fuller be.'] },
      { lines: ['O Light that follow\'st all my way,', 'I yield my flickering torch to Thee;', 'My heart restores its borrowed ray,', 'That in Thy sunshine\'s blaze its day', 'May brighter, fairer be.'] },
      { lines: ['O Joy that seekest me through pain,', 'I cannot close my heart to Thee;', 'I trace the rainbow through the rain,', 'And feel the promise is not vain', 'That morn shall tearless be.'] },
      { lines: ['O Cross that liftest up my head,', 'I dare not ask to fly from Thee;', 'I lay in dust life\'s glory dead,', 'And from the ground there blossoms red', 'Life that shall endless be.'] },
    ],
  },

  {
    id: 'the-love-of-god', number: 65, title: 'The Love of God', author: 'Frederick Lehman',
    year: 1917, category: "God's Love", featured: false,
    tags: ['Love', 'Eternity', 'Grace'],
    chorus: { lines: ['O love of God, how rich and pure!', 'How measureless and strong!', 'It shall forevermore endure', 'The saints\' and angels\' song.'] },
    verses: [
      { lines: ['The love of God is greater far', 'Than tongue or pen can ever tell;', 'It goes beyond the highest star,', 'And reaches to the lowest hell.', 'The guilty pair, bowed down with care,', 'God gave His Son to win;', 'His erring child He reconciled,', 'And pardoned from his sin.'] },
      { lines: ['When hoary time shall pass away,', 'And earthly thrones and kingdoms fall,', 'When men who here refuse to pray,', 'On rocks and hills and mountains call,', 'God\'s love so sure shall still endure,', 'All measureless and strong;', 'Redeeming grace to Adam\'s race—', 'The saints\' and angels\' song.'] },
      { lines: ['Could we with ink the ocean fill,', 'And were the skies of parchment made,', 'Were every stalk on earth a quill,', 'And every man a scribe by trade,', 'To write the love of God above', 'Would drain the ocean dry,', 'Nor could the scroll contain the whole,', 'Though stretched from sky to sky.'] },
    ],
  },

  {
    id: 'jesus-loves-me', number: 66, title: 'Jesus Loves Me', author: 'Anna Bartlett Warner',
    year: 1859, category: "God's Love", featured: false,
    tags: ['Children', 'Love', 'Scripture'],
    chorus: { lines: ['Yes, Jesus loves me!', 'Yes, Jesus loves me!', 'Yes, Jesus loves me!', 'The Bible tells me so.'] },
    verses: [
      { lines: ['Jesus loves me! this I know,', 'For the Bible tells me so;', 'Little ones to Him belong,', 'They are weak, but He is strong.'] },
      { lines: ['Jesus loves me! He who died', 'Heaven\'s gate to open wide;', 'He will wash away my sin,', 'Let His little child come in.'] },
      { lines: ['Jesus loves me! He will stay', 'Close beside me all the way;', 'Thou hast bled and died for me,', 'I will henceforth live for Thee.'] },
    ],
  },

  {
    id: 'o-deep-love-of-jesus', number: 67, title: "O the Deep, Deep Love of Jesus", author: 'Samuel Trevor Francis',
    year: 1875, category: "God's Love", featured: false,
    tags: ['Love', 'Ocean', 'Fullness'],
    verses: [
      { lines: ['O the deep, deep love of Jesus,', 'Vast, unmeasured, boundless, free!', 'Rolling as a mighty ocean', 'In its fullness over me!', 'Underneath me, all around me,', 'Is the current of Thy love;', 'Leading onward, leading homeward', 'To Thy glorious rest above!'] },
      { lines: ['O the deep, deep love of Jesus,', 'Spread His praise from shore to shore!', 'How He loveth, ever loveth,', 'Changeth never, nevermore!', 'How He watches o\'er His loved ones,', 'Died to call them all His own;', 'How for them He intercedeth,', 'Watcheth o\'er them from the throne!'] },
      { lines: ['O the deep, deep love of Jesus,', 'Love of every love the best!', '\'Tis an ocean vast of blessing,', '\'Tis a haven sweet of rest!', 'O the deep, deep love of Jesus,', '\'Tis a heaven of heavens to me;', 'And it lifts me up to glory,', 'For it lifts me up to Thee!'] },
    ],
  },

  {
    id: 'love-divine-all-loves', number: 68, title: 'Love Divine, All Loves Excelling', author: 'Charles Wesley',
    year: 1747, category: "God's Love", featured: false,
    tags: ['Divine Love', 'Sanctification', 'Heaven'],
    verses: [
      { lines: ['Love divine, all loves excelling,', 'Joy of heaven, to earth come down;', 'Fix in us Thy humble dwelling,', 'All Thy faithful mercies crown.', 'Jesus, Thou art all compassion,', 'Pure, unbounded love Thou art;', 'Visit us with Thy salvation,', 'Enter every trembling heart.'] },
      { lines: ['Breathe, O breathe Thy loving Spirit', 'Into every troubled breast!', 'Let us all in Thee inherit,', 'Let us find the promised rest.', 'Take away our bent to sinning,', 'Alpha and Omega be;', 'End of faith, as its beginning,', 'Set our hearts at liberty.'] },
      { lines: ['Come, Almighty to deliver,', 'Let us all Thy life receive;', 'Suddenly return, and never,', 'Nevermore Thy temples leave.', 'Thee we would be always blessing,', 'Serve Thee as Thy hosts above,', 'Pray, and praise Thee without ceasing,', 'Glory in Thy perfect love.'] },
      { lines: ['Finish, then, Thy new creation;', 'Pure and spotless let us be.', 'Let us see Thy great salvation', 'Perfectly restored in Thee;', 'Changed from glory into glory,', 'Till in heaven we take our place,', 'Till we cast our crowns before Thee,', 'Lost in wonder, love, and praise.'] },
    ],
  },

  {
    id: 'jesus-lover-of-my-soul', number: 69, title: 'Jesus, Lover of My Soul', author: 'Charles Wesley',
    year: 1740, category: "God's Love", featured: false,
    tags: ['Refuge', 'Love', 'Grace'],
    verses: [
      { lines: ['Jesus, lover of my soul,', 'Let me to Thy bosom fly,', 'While the nearer waters roll,', 'While the tempest still is high.', 'Hide me, O my Savior, hide,', 'Till the storm of life is past;', 'Safe into the haven guide,', 'O receive my soul at last!'] },
      { lines: ['Other refuge have I none,', 'Hangs my helpless soul on Thee;', 'Leave, ah! leave me not alone,', 'Still support and comfort me.', 'All my trust on Thee is stayed,', 'All my help from Thee I bring;', 'Cover my defenseless head', 'With the shadow of Thy wing.'] },
      { lines: ['Thou, O Christ, art all I want,', 'More than all in Thee I find;', 'Raise the fallen, cheer the faint,', 'Heal the sick, and lead the blind.', 'Just and holy is Thy name,', 'I am all unrighteousness;', 'False and full of sin I am,', 'Thou art full of truth and grace.'] },
      { lines: ['Plenteous grace with Thee is found,', 'Grace to cover all my sin;', 'Let the healing streams abound,', 'Make and keep me pure within.', 'Thou of life the fountain art,', 'Freely let me take of Thee;', 'Spring Thou up within my heart,', 'Rise to all eternity.'] },
    ],
  },

  {
    id: 'my-jesus-i-love-thee', number: 70, title: 'My Jesus, I Love Thee', author: 'William Featherstone',
    year: 1864, category: "God's Love", featured: false,
    tags: ['Love', 'Devotion', 'Eternity'],
    verses: [
      { lines: ['My Jesus, I love Thee, I know Thou art mine;', 'For Thee all the follies of sin I resign.', 'My gracious Redeemer, my Savior art Thou;', 'If ever I loved Thee, my Jesus, \'tis now.'] },
      { lines: ['I love Thee because Thou hast first loved me,', 'And purchased my pardon on Calvary\'s tree.', 'I love Thee for wearing the thorns on Thy brow;', 'If ever I loved Thee, my Jesus, \'tis now.'] },
      { lines: ['I\'ll love Thee in life, I will love Thee in death,', 'And praise Thee as long as Thou lendest me breath;', 'And say when the death dew lies cold on my brow,', '"If ever I loved Thee, my Jesus, \'tis now."'] },
      { lines: ['In mansions of glory and endless delight,', 'I\'ll ever adore Thee in heaven so bright;', 'I\'ll sing with the glittering crown on my brow:', '"If ever I loved Thee, my Jesus, \'tis now."'] },
    ],
  },

  {
    id: 'savior-like-a-shepherd', number: 71, title: 'Savior, Like a Shepherd Lead Us', author: 'Dorothy Thrupp',
    year: 1836, category: "God's Love", featured: false,
    tags: ['Shepherd', 'Guidance', 'Love'],
    verses: [
      { lines: ['Savior, like a shepherd lead us,', 'Much we need Thy tender care;', 'In Thy pleasant pastures feed us,', 'For our use Thy folds prepare.', 'Blessed Jesus, blessed Jesus!', 'Thou hast bought us, Thine we are.', 'Blessed Jesus, blessed Jesus!', 'Thou hast bought us, Thine we are.'] },
      { lines: ['We are Thine, do Thou befriend us,', 'Be the guardian of our way;', 'Keep Thy flock, from sin defend us,', 'Seek us when we go astray.', 'Blessed Jesus, blessed Jesus!', 'Hear, O hear us when we pray.', 'Blessed Jesus, blessed Jesus!', 'Hear, O hear us when we pray.'] },
      { lines: ['Thou hast promised to receive us,', 'Poor and sinful though we be;', 'Thou hast mercy to relieve us,', 'Grace to cleanse and power to free.', 'Blessed Jesus, blessed Jesus!', 'Early let us turn to Thee.', 'Blessed Jesus, blessed Jesus!', 'Early let us turn to Thee.'] },
      { lines: ['Early let us seek Thy favor,', 'Early let us do Thy will;', 'Blessed Lord and only Savior,', 'With Thy love our bosoms fill.', 'Blessed Jesus, blessed Jesus!', 'Thou hast loved us, love us still.', 'Blessed Jesus, blessed Jesus!', 'Thou hast loved us, love us still.'] },
    ],
  },

  {
    id: 'the-lords-my-shepherd', number: 72, title: "The Lord's My Shepherd", author: 'Scottish Psalter',
    year: 1650, category: "God's Love", featured: true,
    tags: ['Psalm 23', 'Shepherd', 'Peace'],
    verses: [
      { lines: ['The Lord\'s my Shepherd, I\'ll not want;', 'He makes me down to lie', 'In pastures green; He leadeth me', 'The quiet waters by.'] },
      { lines: ['My soul He doth restore again,', 'And me to walk doth make', 'Within the paths of righteousness,', 'E\'en for His own name\'s sake.'] },
      { lines: ['Yea, though I walk through death\'s dark vale,', 'Yet will I fear none ill;', 'For Thou art with me, and Thy rod', 'And staff me comfort still.'] },
      { lines: ['My table Thou hast furnished', 'In presence of my foes;', 'My head Thou dost with oil anoint,', 'And my cup overflows.'] },
      { lines: ['Goodness and mercy all my life', 'Shall surely follow me;', 'And in God\'s house forevermore', 'My dwelling place shall be.'] },
    ],
  },

  {
    id: 'he-lives', number: 73, title: 'He Lives', author: 'Alfred Ackley',
    year: 1933, category: "God's Love", featured: false,
    tags: ['Resurrection', 'Living Christ', 'Victory'],
    chorus: { lines: ['He lives, He lives, Christ Jesus lives today!', 'He walks with me and talks with me', 'Along life\'s narrow way.', 'He lives, He lives, salvation to impart!', 'You ask me how I know He lives?', 'He lives within my heart.'] },
    verses: [
      { lines: ['I serve a risen Savior, He\'s in the world today;', 'I know that He is living, whatever men may say;', 'I see His hand of mercy, I hear His voice of cheer,', 'And just the time I need Him, He\'s always near.'] },
      { lines: ['In all the world around me I see His loving care,', 'And though my heart grows weary, I never will despair;', 'I know that He is leading through all the stormy blast,', 'The day of His appearing will come at last.'] },
      { lines: ['Rejoice, rejoice, O Christian, lift up your voice and sing', 'Eternal hallelujahs to Jesus Christ the King!', 'The hope of all who seek Him, the help of all who find,', 'None other is so loving, so good and kind.'] },
    ],
  },

  {
    id: 'o-how-i-love-jesus', number: 74, title: 'O How I Love Jesus', author: 'Frederick Whitfield',
    year: 1855, category: "God's Love", featured: false,
    tags: ['Love', 'Praise', 'Testimony'],
    chorus: { lines: ['O how I love Jesus,', 'O how I love Jesus,', 'O how I love Jesus,', 'Because He first loved me!'] },
    verses: [
      { lines: ['There is a name I love to hear,', 'I love to sing its worth;', 'It sounds like music in mine ear,', 'The sweetest name on earth.'] },
      { lines: ['It tells me of a Savior\'s love,', 'Who died to set me free;', 'It tells me of His precious blood,', 'The sinner\'s perfect plea.'] },
      { lines: ['It tells me what my Father hath', 'Reserved for every faith—', 'And, though I tread a darksome path,', 'Yields sunshine all the way.'] },
      { lines: ['It tells of One whose loving heart', 'Can feel my deepest woe,', 'Who in each sorrow bears a part', 'That none can bear below.'] },
    ],
  },

  {
    id: 'jesus-keep-me-near-the-cross', number: 75, title: 'Jesus, Keep Me Near the Cross', author: 'Fanny Crosby',
    year: 1869, category: "God's Love", featured: false,
    tags: ['Cross', 'Cleansing', 'Hope'],
    chorus: { lines: ['In the cross, in the cross,', 'Be my glory ever,', 'Till my raptured soul shall find', 'Rest beyond the river.'] },
    verses: [
      { lines: ['Jesus, keep me near the cross,', 'There a precious fountain,', 'Free to all, a healing stream,', 'Flows from Calvary\'s mountain.'] },
      { lines: ['Near the cross, a trembling soul,', 'Love and mercy found me;', 'There the bright and morning star', 'Sheds its beams around me.'] },
      { lines: ['Near the cross! O Lamb of God,', 'Bring its scenes before me;', 'Help me walk from day to day,', 'With its shadow o\'er me.'] },
      { lines: ['Near the cross I\'ll watch and wait,', 'Hoping, trusting ever,', 'Till I reach the golden strand', 'Just beyond the river.'] },
    ],
  },

  // ── Hymns 76–83 (with bundled audio) ─────────────────────────────────────

  {
    id: 'i-am-thine-o-lord', number: 76, title: 'I Am Thine, O Lord', author: 'Fanny Crosby',
    year: 1875, category: 'Prayer & Devotion', featured: false,
    tags: ['Prayer', 'Devotion', 'Surrender', 'Fellowship'],
    chorus: { lines: ['Draw me nearer, nearer, blessed Lord,', 'To the cross where Thou hast died;', 'Draw me nearer, nearer, nearer, blessed Lord,', 'To Thy precious bleeding side.'] },
    verses: [
      { lines: ['I am Thine, O Lord, I have heard Thy voice,', 'And it told Thy love to me;', 'But I long to rise in the arms of faith', 'And be closer drawn to Thee.'] },
      { lines: ['Consecrate me now to Thy service, Lord,', 'By the pow\'r of grace divine;', 'Let my soul look up with a steadfast hope,', 'And my will be lost in Thine.'] },
      { lines: ['O the pure delight of a single hour', 'That before Thy throne I spend,', 'When I kneel in prayer, and with Thee, my God,', 'I commune as friend with friend!'] },
      { lines: ['There are depths of love that I cannot know', 'Till I cross the narrow sea;', 'There are heights of joy that I may not reach', 'Till I rest in peace with Thee.'] },
    ],
  },

  {
    id: 'before-the-throne', number: 77, title: 'Before the Throne of God Above', author: 'Charitie Lees Bancroft',
    year: 1863, category: 'Grace & Salvation', featured: false,
    tags: ['Atonement', 'Intercession', 'Security', 'Righteousness'],
    verses: [
      { lines: ['Before the throne of God above', 'I have a strong and perfect plea;', 'A great High Priest whose name is Love,', 'Who ever lives and pleads for me.', 'My name is graven on His hands,', 'My name is written on His heart;', 'I know that while in heav\'n He stands', 'No tongue can bid me thence depart.'] },
      { lines: ['When Satan tempts me to despair', 'And tells me of the guilt within,', 'Upward I look and see Him there', 'Who made an end of all my sin.', 'Because the sinless Savior died', 'My sinful soul is counted free;', 'For God the Just is satisfied', 'To look on Him and pardon me.'] },
      { lines: ['Behold Him there! The risen Lamb,', 'My perfect, spotless Righteousness;', 'The great unchangeable I AM,', 'The King of glory and of grace!', 'One with Himself I cannot die,', 'My soul is purchased by His blood;', 'My life is hid with Christ on high,', 'With Christ my Savior and my God.'] },
    ],
  },

  {
    id: 'in-my-heart', number: 78, title: 'In My Heart There Rings a Melody', author: 'Elton Roth',
    year: 1924, category: 'Worship & Praise', featured: false,
    tags: ['Joy', 'Song', 'Praise', 'Jesus'],
    chorus: { lines: ['In my heart there rings a melody,', 'There rings a melody with heaven\'s harmony;', 'In my heart there rings a melody,', 'There rings a melody of love!'] },
    verses: [
      { lines: ['I have a song that Jesus gave me,', 'It was sent from heav\'n above;', 'There never was a sweeter melody,', '\'Tis a melody of love.'] },
      { lines: ['I love the Christ who died on Calv\'ry,', 'For He washed my sins away;', 'He put within my heart a melody,', 'And I know it\'s there to stay.'] },
      { lines: ['\'Twill be my endless theme in glory,', 'With the angels I will sing;', '\'Twill be a song with glorious harmony,', 'When the courts of heav\'n ring.'] },
    ],
  },

  {
    id: 'awesome-god', number: 79, title: 'Awesome God', author: 'Rich Mullins',
    year: 1988, category: 'Worship & Praise', featured: false,
    tags: ['God\'s Power', 'Majesty', 'Holiness', 'Contemporary'],
    chorus: { lines: ['Our God is an awesome God,', 'He reigns from heaven above;', 'With wisdom, power, and love,', 'Our God is an awesome God.'] },
    verses: [
      { lines: ['When He rolls up His sleeves He ain\'t just putting on the ritz,', 'Our God is an awesome God;', 'There is thunder in His footsteps and lightning in His fists,', 'Our God is an awesome God.'] },
      { lines: ['And the Lord wasn\'t joking when He kicked \'em out of Eden,', 'It wasn\'t for no reason that He shed His blood;', 'His return is very close and so you better be believing', 'That our God is an awesome God.'] },
    ],
  },

  {
    id: 'springs-of-living-water', number: 80, title: 'Springs of Living Water', author: 'John W. Peterson',
    year: 1950, category: 'Faith & Trust', featured: false,
    tags: ['Salvation', 'Satisfaction', 'Living Water', 'Joy'],
    chorus: { lines: ['Drinking at the springs of living water,', 'Happy now am I, my soul is satisfied;', 'Drinking at the springs of living water,', 'O wonderful and bountiful supply!'] },
    verses: [
      { lines: ['I thirsted in the barren land of sin and shame,', 'And nothing satisfying there I found;', 'But to the blessed cross of Christ one day I came,', 'Where springs of living water did abound.'] },
      { lines: ['How sweet the springs of living water taste to me,', 'My life is hid with Christ who sets me free;', 'The world itself is barren, but amid its strife', 'Are springs of living water—fullest life!'] },
      { lines: ['O sinner, hear the call of Christ who calls to you,', '"If any man is thirsty, let him come";', 'These springs of living water are for you too—', 'Come drink and find in Him your heart\'s true home.'] },
    ],
  },

  {
    id: 'faith-of-our-fathers', number: 81, title: 'Faith of Our Fathers', author: 'Frederick Faber',
    year: 1849, category: 'Faith & Trust', featured: false,
    tags: ['Faith', 'Perseverance', 'Heritage', 'Church'],
    chorus: { lines: ['Faith of our fathers, holy faith!', 'We will be true to thee till death.'] },
    verses: [
      { lines: ['Faith of our fathers! living still', 'In spite of dungeon, fire, and sword;', 'O how our hearts beat high with joy', 'Whene\'er we hear that glorious word!'] },
      { lines: ['Our fathers, chained in prisons dark,', 'Were still in heart and conscience free;', 'How sweet would be their children\'s fate,', 'If they, like them, could die for thee!'] },
      { lines: ['Faith of our fathers! we will love', 'Both friend and foe in all our strife;', 'And preach thee, too, as love knows how,', 'By kindly words and virtuous life.'] },
    ],
  },

  {
    id: 'sweet-by-and-by', number: 82, title: 'Sweet By and By', author: 'Sanford F. Bennett',
    year: 1868, category: 'Faith & Trust', featured: false,
    tags: ['Heaven', 'Hope', 'Eternity', 'Peace'],
    chorus: { lines: ['In the sweet by and by,', 'We shall meet on that beautiful shore;', 'In the sweet by and by,', 'We shall meet on that beautiful shore.'] },
    verses: [
      { lines: ['There\'s a land that is fairer than day,', 'And by faith we can see it afar;', 'For the Father waits over the way', 'To prepare us a dwelling place there.'] },
      { lines: ['We shall sing on that beautiful shore', 'The melodious songs of the blessed;', 'And our spirits shall sorrow no more,', 'Not a sigh for the blessing of rest.'] },
      { lines: ['To our bountiful Father above,', 'We will offer our tribute of praise', 'For the glorious gift of His love', 'And the blessings that hallow our days.'] },
    ],
  },

  {
    id: 'count-your-blessings', number: 83, title: 'Count Your Blessings', author: 'Johnson Oatman Jr.',
    year: 1897, category: 'Faith & Trust', featured: false,
    tags: ['Gratitude', 'Encouragement', 'God\'s Goodness', 'Perseverance'],
    chorus: { lines: ['Count your blessings, name them one by one;', 'Count your blessings, see what God hath done;', 'Count your blessings, name them one by one;', 'Count your many blessings, see what God hath done.'] },
    verses: [
      { lines: ['When upon life\'s billows you are tempest-tossed,', 'When you are discouraged, thinking all is lost,', 'Count your many blessings, name them one by one,', 'And it will surprise you what the Lord hath done.'] },
      { lines: ['Are you ever burdened with a load of care?', 'Does the cross seem heavy you are called to bear?', 'Count your many blessings, every doubt will fly,', 'And you will keep singing as the days go by.'] },
      { lines: ['When you look at others with their lands and gold,', 'Think that Christ has promised you His wealth untold;', 'Count your many blessings—wealth can never buy', 'Your reward in heaven, nor your home on high.'] },
      { lines: ['So, amid the conflict whether great or small,', 'Do not be discouraged, God is over all;', 'Count your many blessings, angels will attend,', 'Help and comfort give you to your journey\'s end.'] },
    ],
  },

  {
    id: 'just-a-closer-walk', number: 84, title: 'Just a Closer Walk with Thee', author: 'Traditional',
    year: 1800, category: 'Prayer & Devotion', featured: false,
    tags: ['Devotion', 'Walking with God', 'Weakness', 'Trust'],
    chorus: { lines: ['Just a closer walk with Thee,', 'Grant it, Jesus, is my plea,', 'Daily walking close to Thee,', 'Let it be, dear Lord, let it be.'] },
    verses: [
      { lines: ['I am weak, but Thou art strong;', 'Jesus, keep me from all wrong;', 'I\'ll be satisfied as long', 'As I walk, let me walk close to Thee.'] },
      { lines: ['Through this world of toil and snares,', 'If I falter, Lord, who cares?', 'Who with me my burden shares?', 'None but Thee, dear Lord, none but Thee.'] },
      { lines: ['When my feeble life is o\'er,', 'Time for me will be no more;', 'Guide me gently, safely o\'er', 'To Thy kingdom shore, to Thy shore.'] },
    ],
  },

  {
    id: 'at-the-cross', number: 85, title: 'At the Cross', author: 'Isaac Watts / Ralph E. Hudson',
    year: 1707, category: 'Grace & Salvation', featured: false,
    tags: ['Cross', 'Redemption', 'Grace', 'Salvation', 'Atonement'],
    chorus: { lines: ['At the cross, at the cross where I first saw the light,', 'And the burden of my heart rolled away,', 'It was there by faith I received my sight,', 'And now I am happy all the day!'] },
    verses: [
      { lines: ['Alas! and did my Savior bleed?', 'And did my Sovereign die?', 'Would He devote that sacred head', 'For such a worm as I?'] },
      { lines: ['Was it for crimes that I have done', 'He groaned upon the tree?', 'Amazing pity! grace unknown!', 'And love beyond degree!'] },
      { lines: ['Well might the sun in darkness hide,', 'And shut his glories in,', 'When Christ, the mighty Maker, died', 'For man the creature\'s sin.'] },
      { lines: ['Thus might I hide my blushing face', 'While His dear cross appears,', 'Dissolve my heart in thankfulness,', 'And melt mine eyes to tears.'] },
      { lines: ['But drops of grief can ne\'er repay', 'The debt of love I owe;', 'Here, Lord, I give myself away,', '\'Tis all that I can do.'] },
    ],
  },

  {
    id: 'tis-so-sweet', number: 86, title: '\'Tis So Sweet to Trust in Jesus', author: 'Louisa M. R. Stead',
    year: 1882, category: 'Faith & Trust', featured: false,
    tags: ['Trust', 'Faith', 'Jesus', 'Peace', 'Rest'],
    chorus: { lines: ['Jesus, Jesus, how I trust Him!', 'How I\'ve proved Him o\'er and o\'er!', 'Jesus, Jesus, precious Jesus!', 'O for grace to trust Him more!'] },
    verses: [
      { lines: ['\'Tis so sweet to trust in Jesus,', 'Just to take Him at His word;', 'Just to rest upon His promise;', 'Just to know, "Thus saith the Lord!"'] },
      { lines: ['O how sweet to trust in Jesus,', 'Just to trust His cleansing blood;', 'Just in simple faith to plunge me', '\'Neath the healing, cleansing flood!'] },
      { lines: ['Yes, \'tis sweet to trust in Jesus,', 'Just from sin and self to cease;', 'Just from Jesus simply taking', 'Life and rest, and joy and peace.'] },
      { lines: ['I\'m so glad I learned to trust Thee,', 'Precious Jesus, Savior, Friend;', 'And I know that Thou art with me,', 'Wilt be with me to the end.'] },
    ],
  },

  {
    id: 'jesus-saves', number: 87, title: 'Jesus Saves', author: 'Priscilla J. Owens',
    year: 1882, category: 'Grace & Salvation', featured: false,
    tags: ['Salvation', 'Evangelism', 'Proclamation', 'Victory', 'Mission'],
    verses: [
      { lines: ['We have heard the joyful sound:', 'Jesus saves! Jesus saves!', 'Spread the tidings all around:', 'Jesus saves! Jesus saves!', 'Bear the news to every land,', 'Climb the steeps and cross the waves;', 'Onward! \'tis our Lord\'s command;', 'Jesus saves! Jesus saves!'] },
      { lines: ['Waft it on the rolling tide:', 'Jesus saves! Jesus saves!', 'Tell to sinners far and wide:', 'Jesus saves! Jesus saves!', 'Sing, ye islands of the sea;', 'Echo back, ye ocean caves;', 'Earth shall keep her jubilee:', 'Jesus saves! Jesus saves!'] },
      { lines: ['Sing above the battle strife:', 'Jesus saves! Jesus saves!', 'By His death and endless life,', 'Jesus saves! Jesus saves!', 'Sing it softly through the gloom,', 'When the heart for mercy craves;', 'Sing in triumph o\'er the tomb:', 'Jesus saves! Jesus saves!'] },
      { lines: ['Give the winds a mighty voice:', 'Jesus saves! Jesus saves!', 'Let the nations now rejoice:', 'Jesus saves! Jesus saves!', 'Shout salvation full and free,', 'Highest hills and deepest caves;', 'This our song of victory:', 'Jesus saves! Jesus saves!'] },
    ],
  },

  {
    id: 'only-trust-him', number: 88, title: 'Only Trust Him', author: 'John H. Stockton',
    year: 1874, category: 'Grace & Salvation', featured: false,
    tags: ['Trust', 'Salvation', 'Invitation', 'Faith'],
    chorus: { lines: ['Only trust Him, only trust Him,', 'Only trust Him now;', 'He will save you, He will save you,', 'He will save you now.'] },
    verses: [
      { lines: ['Come, every soul by sin oppressed,', 'There\'s mercy with the Lord,', 'And He will surely give you rest,', 'By trusting in His Word.'] },
      { lines: ['For Jesus shed His precious blood', 'Rich blessings to bestow;', 'Plunge now into the crimson flood', 'That washes white as snow.'] },
      { lines: ['Yes, Jesus is the Truth, the Way,', 'That leads you into rest;', 'Believe in Him without delay,', 'And you are fully blest.'] },
      { lines: ['Come, then, and join this holy band,', 'And on to glory go,', 'To dwell in that celestial land,', 'Where joys immortal flow.'] },
    ],
  },

  {
    id: 'it-is-well-with-my-soul', number: 89, title: 'It Is Well with My Soul', author: 'Horatio Spafford',
    year: 1873, category: 'Faith & Trust', featured: false,
    tags: ['Peace', 'Trust', 'Trials', 'Hope', 'Assurance'],
    chorus: { lines: ['It is well with my soul,', 'It is well, it is well with my soul.'] },
    verses: [
      { lines: ['When peace like a river attendeth my way,', 'When sorrows like sea billows roll;', 'Whatever my lot, Thou hast taught me to say,', 'It is well, it is well, with my soul.'] },
      { lines: ['Though Satan should buffet, though trials should come,', 'Let this blest assurance control,', 'That Christ has regarded my helpless estate,', 'And hath shed His own blood for my soul.'] },
      { lines: ['My sin, oh, the bliss of this glorious thought!', 'My sin, not in part but the whole,', 'Is nailed to the cross, and I bear it no more,', 'Praise the Lord, praise the Lord, O my soul!'] },
      { lines: ['For me, be it Christ, be it Christ hence to live:', 'If Jordan above me shall roll,', 'No pang shall be mine, for in death as in life', 'Thou wilt whisper Thy peace to my soul.'] },
      { lines: ['But, Lord, \'tis for Thee, for Thy coming we wait,', 'The sky, not the grave, our goal;', 'Oh, trump of the angel! Oh, voice of the Lord!', 'Blessed hope, blessed rest of my soul.'] },
      { lines: ['And Lord, haste the day when the faith shall be sight,', 'The clouds be rolled back as a scroll;', 'The trump shall resound, and the Lord shall descend,', 'Even so, it is well with my soul.'] },
    ],
  },

  {
    id: 'were-you-there', number: 90, title: 'Were You There?', author: 'African American Spiritual',
    year: 1865, category: 'Grace & Salvation', featured: false,
    tags: ['Cross', 'Crucifixion', 'Lament', 'Spiritual', 'Resurrection'],
    verses: [
      { lines: ['Were you there when they crucified my Lord?', 'Were you there when they crucified my Lord?', 'Oh! Sometimes it causes me to tremble, tremble, tremble.', 'Were you there when they crucified my Lord?'] },
      { lines: ['Were you there when they nailed Him to the tree?', 'Were you there when they nailed Him to the tree?', 'Oh! Sometimes it causes me to tremble, tremble, tremble.', 'Were you there when they nailed Him to the tree?'] },
      { lines: ['Were you there when they pierced Him in the side?', 'Were you there when they pierced Him in the side?', 'Oh! Sometimes it causes me to tremble, tremble, tremble.', 'Were you there when they pierced Him in the side?'] },
      { lines: ['Were you there when the sun refused to shine?', 'Were you there when the sun refused to shine?', 'Oh! Sometimes it causes me to tremble, tremble, tremble.', 'Were you there when the sun refused to shine?'] },
      { lines: ['Were you there when they laid Him in the tomb?', 'Were you there when they laid Him in the tomb?', 'Oh! Sometimes it causes me to tremble, tremble, tremble.', 'Were you there when they laid Him in the tomb?'] },
      { lines: ['Were you there when He rose up from the grave?', 'Were you there when He rose up from the grave?', 'Oh! Sometimes I feel like shouting, glory, glory, glory!', 'Were you there when He rose up from the grave?'] },
    ],
  },

];
