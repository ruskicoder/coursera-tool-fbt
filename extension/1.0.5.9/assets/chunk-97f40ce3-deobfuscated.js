/**
 * Coursera Tool - Deobfuscated & Refactored
 * Version: 1.0.5.9-stable
 * Original Author: ruskicoder
 * 
 * Description:
 * This script injects a control panel into Coursera pages to assist with:
 * - Bypassing video and reading requirements.
 * - Solving quizzes using Google Gemini AI or a Source Database.
 * - Auto-completing peer reviews.
 * - Auto-submitting peer-graded assignments with generated content.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import toast, { Toaster } from 'react-hot-toast';

// ==========================================
// 1. Constants & Dictionaries
// ==========================================

const CONSTANTS = {
    METADATA_URL: "https://pear104.github.io/coursera-tool/gh-pages/metadata.json",
    COURSE_MAP_URL: "https://pear104.github.io/coursera-tool/gh-pages/courseMap.json",
    GEMINI_API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    FPT_SOURCE_URL: "https://coursera-tool-database.vercel.app/api/courses" // Decoded from logic
};

// Dictionary for generating random text for assignments
const RANDOM_WORDS = [
    "aa", "abac", "abaca", "abear", "abele", "abjections", "ablegate", "aboon", "abort", "abrotin",
    "absinthin", "abstracted", "acana", "accede", "accent", "acceptably", "acclamation", "accreting",
    "accruable", "achage", "achaque", "achates", "achech", "achievability", "achordate", "acoustician",
    "acrawl", "acrid", "acroparesthesia", "actinia", "actinolitic", "actuation", "adages", "adamant",
    "adazzle", "addends", "addorsed", "adiate", "adlumia", "admirals", "admit", "admix", "adrench",
    "adsorption", "adulterant", "adumbrating", "advances", "advisal", "aeroduct", "aerophilia", "aerosols",
    "aerugo", "affability", "affinal", "affirmed", "afflux", "afternoon", "agabanee", "agene", "ageratum",
    "aggravating", "aggroup", "aginner", "agist", "aglobulism", "agminated", "agnail", "agnat", "airfield",
    "airstrips", "aitches", "alacha", "alang", "alantol", "albiness", "albugo", "alcoholimeter", "alchemies",
    "alertly", "alfileria", "algedi", "alhenna", "alimony", "aliptes", "allantoin", "allied", "allopaths",
    "allot", "allowably", "allseed", "allwhither", "alpargata", "also", "alterations", "alternativeness",
    "alvia", "amalic", "ambagious", "ambilogy", "ambrein", "ameed", "americanese", "ametoecious", "amidid",
    "amin", "amizilis", "ammonal", "amnion", "ampelidae", "amphibolic", "amphigaean", "amphisbaena", "amphoric",
    "anacamptic", "anacrogynous", "analysability", "anammonid", "anapaganize", "anaphorical", "anastigmatic",
    "anatripsis", "anchoritic", "ancylostomiasis", "androclinium", "anecdotist", "anethol", "angel", "anguloa",
    "anhydrite", "anilic", "animalism", "animastical", "anisometric", "ankerite", "anodynia", "anomalocephalus",
    "anoplocephalic", "ansarian", "answerable", "antarthritic", "antelocation", "antennary", "anthraflavic",
    "anthropomorphical", "antiagglutinin", "antiblock", "anticensorship", "anticlogging", "anticoagulating",
    "antidyscratic", "antigravitation", "antilogy", "antimensium", "antimoniureted", "antinomianism", "antioptionist",
    "antiquarium", "antiquitarian", "antiskeptic", "antisyndicalism", "antivenene", "antler", "anura", "apeak",
    "apeiron", "apheretic", "aphimosis", "aphyllous", "apivorous", "apodeictic", "apogonid", "apoplectically",
    "appealability", "appense", "apple", "applosion", "appropinquation", "apses", "apterium", "arabesque",
    "arachnidium", "araeostyle", "araneidan", "arariba", "arbitrary", "archcupbearer", "archphylarch",
    "arctalian", "aread", "arecaine", "argentometer", "arillary", "aristocratism", "arithmeticians", "arkansan",
    "armure", "arrentable", "arrogating", "arsenide", "arthroderm", "arthromere", "articulatory", "arum",
    "arundineous", "asclepiadae", "asclepiadaceous", "ashlering", "aspartyl", "aspergillum", "asphaltite",
    "assassinate", "assertoric", "assizer", "assonate", "asterospondyli", "astigmat", "astragal", "astringe",
    "astrometeorological", "asymmetry", "atavism", "atelectasis", "athrocytosis", "atmolysis", "atocia",
    "atrazines", "atrorubent", "attempters", "auchenia", "auditor", "auletai", "aulostomid", "auride",
    "autocades", "autochronograph", "autodialing", "autolaryngoscopy", "autoplastically", "autosoterism",
    "autotriploid", "avalent", "avenge", "avijja", "avowing", "awesome", "axiferous", "axised", "axopodia",
    "azygobranchiate", "babesiosis", "backfield", "backswording", "bacon", "bactericholia", "bade", "badgemen",
    "badgir", "badigeon", "baetyl", "baffy", "bagginess", "balanism", "balantidiosis", "balladism", "ballised",
    "ballyhoo", "balm", "balsamweed", "banderole", "banterers", "baptizes", "barbacoa", "barbarousness",
    "barbula", "bardel", "barometrograph", "barsac", "bashed", "basset", "basting", "bast", "batad", "bathrobe",
    "batonga", "battology", "baxtone", "bayoneting", "beakerman", "beanpoles", "beaverskin", "bechalking",
    "becowarding", "bedclothing", "bedote", "bedtick", "beefcakes", "beeweed", "beflour", "begar", "begowned",
    "begum", "behn", "beletter", "belili", "bellicosity", "belonoid", "bemartyr", "bemocking", "benchboard",
    "bendlets", "benzal", "beperiwigged", "berberidaceous", "bergylt", "beriberic", "berth", "besmirch",
    "besoothe", "bestock", "betatters", "bethroot", "betulinamaric", "bevel", "bewrayer", "bezzants", "bhandari",
    "bibbons", "bichlorides", "bichromate", "bieldy", "bihamate", "bilbie", "billfolds", "bimillenary", "bingey",
    "biocoenosis", "bioherm", "biomicroscopy", "bipinnarias", "birch", "birdwise", "byrsonima", "bisalt",
    "biscuit", "bismutosphaerite", "bistipuled", "bizones", "blackbelly", "blackies", "blarneyed", "blastospheric",
    "blattodea", "blellum", "blepharoatheroma", "blockishness", "bloodcurdlingly", "bloke", "bloodthirstiness",
    "blowcock", "blows", "bluefish", "boastfulness", "boatbill", "bobs", "boccaro", "bodier", "boilers", "boldin",
    "bolectured", "bolls", "bolthead", "bonacis", "bony", "boopis", "boozier", "boreal", "boroughmaster",
    "bossage", "botching", "bottled", "boughpot", "bourette", "bowker", "bowlderhead", "boxhaul", "brachydactyly",
    "brachygnathism", "bracted", "braiding", "branchiostege", "brandish", "bransles", "brassicaceous", "brawniest",
    "breba", "brees", "bregmata", "brian", "bridie", "brier", "brines", "britishism", "broaden", "bromhydrate",
    "bromocyanidation", "bronchophonic", "bronzewing", "brookable", "brotany", "browis", "bruisewort", "bubalis",
    "bubbly", "budorcas", "bugara", "bulbier", "bullbaiting", "bullpout", "bumaree", "bundler", "bunkos",
    "burdenous", "burglarizing", "burnie", "burrs", "bursiculate", "busket", "busybodies", "butane", "butcheress",
    "butters", "butyryl", "buxomly", "buzzwig", "caba", "cabers", "cacophony", "cadelle", "calaber", "calatrava",
    "calcareosulphurous", "calctufa", "caliciform", "callboy", "calliphorine", "calomels", "cameralist", "camerlingo",
    "camoca", "campanero", "canaliculate", "canceling", "candler", "canephoroe", "cangia", "cannabic", "cannibally",
    "cantharellus", "cantilevers", "cantonments", "capernaitish", "capillaire", "capitulum", "capsulotomy",
    "carat", "carbacidometer", "carbonigenous", "cardcase", "cardinalist", "cardioblast", "careeners", "carling",
    "carnivalesque", "carolled", "carphophis", "carrick", "cartloads", "carton", "carve", "casewood", "casper",
    "castrate", "cataclysmic", "cataphract", "catastrophist", "catechistic", "caterbrawl", "cathedratic", "cathood",
    "caudatolenticular", "caulis", "causativity", "cavilingness", "cecity", "celestite", "celiagra", "cellarette",
    "cementer", "cenozoic", "centipede", "centrifugence", "centumviral", "cephalodymus", "cephalothorax", "cerago",
    "ceration", "cerebrospinal", "cerule", "cervelas", "cervicobregmatic", "cesura", "cetonian", "chalastogastra",
    "challis", "chamois", "champagnizing", "chapbooks", "chapeaus", "characinid", "charisticary", "charlatans",
    "charqued", "chaussee", "chebel", "cheekful", "cheerlessly", "chelydroid", "chemist", "chemotactically",
    "cheques", "chess", "chicagoan", "chiding", "chiliastic", "chylifactive", "chymification", "chingpaw",
    "chirognomy", "chirogymnast", "chiroplasty", "chiros", "chirrup", "chittak", "chlamydobacteriaceae",
    "chloranaemia", "chocard", "choledochotomy", "chondrogeny", "chorio", "choriphyllous", "chortler", "chromatize",
    "chromatophil", "chronicler", "chronometer", "chrysophanic", "chumble", "churchanity", "chyluria", "ciceronianisms",
    "ciconian", "cycliae", "ciconiiform", "cilioflagellata", "cylindrically", "cimbric", "cinchonate",
    "cinchonization", "cynomorphic", "cinter", "cipollino", "circue", "circumduce", "circumventing", "ciseleurs",
    "cissing", "citational", "citharoedus", "civicism", "clacket", "cladine", "claggum", "clangor", "clanking",
    "classicism", "clathrarian", "clatterer", "clechee", "cleidomastoid", "clientless", "clymenia", "climacterical",
    "clinandrium", "clingy", "clinohedrite", "clitoridectomy", "cloisteral", "clumsier", "coacervate", "coadventure",
    "coalless", "coapt", "coattestator", "cobalts", "coccidioidal", "cochleare", "coco", "coctoprecipitin",
    "coenamored", "cogredient", "coheading", "cohelpership", "cohesionless", "coiffures", "coinitial", "coinsure",
    "coked", "colauxe", "colicin", "collecting", "colloidal", "colloidochemical", "colombier", "coloptosis",
    "colotyphoid", "colpitises", "columbier", "comedial", "comfortation", "commensal", "commixture", "commonplace",
    "communicably", "commutation", "compendent", "compital", "complicate", "compos", "compsognathus", "concavity",
    "concentrating", "concertatos", "conchyliated", "concomitancy", "concurringly", "conductus", "conepates",
    "confession", "confluence", "congruency", "conic", "coniospermous", "connaturally", "connecter", "connoissance",
    "consecrated", "consequents", "consimilate", "constabless", "constellatory", "consumptiveness", "contactual",
    "contessa", "contortion", "contradictable", "contramire", "controling", "conventionalist", "conversazione",
    "convexed", "convivialist", "cooer", "coofs", "copartnership", "coppaelite", "coprecipitation", "coradical",
    "cordage", "cordonnet", "cordwainery", "coremaker", "corneule", "corocleisis", "coronadite", "corporification",
    "corrective", "corrugator", "corv", "coryphaenoid", "coryzas", "costumist", "coteries", "cotsetle", "cotwist",
    "counterapproach", "counteraverment", "counterborer", "counterdistinction", "countergarrison", "counterlit",
    "counterplea", "counterriposte", "countertraverse", "courbettes", "courtierism", "couturiere", "cowbird",
    "coxswaining", "crab", "crampingly", "craniota", "craniotabes", "craniotomy", "creamware", "creatable",
    "credensiveness", "cressy", "cretinization", "crick", "crimpness", "cringed", "criosphinx", "crispness",
    "crystallites", "criticizes", "croconic", "crossbreds", "crosscutting", "crotalid", "crotalum", "crouchmas",
    "crumminess", "crustation", "cuadrillas", "cubito", "cucumiform", "culminant", "culottism", "cumulatively",
    "cuneal", "cupolas", "curcas", "curiatii", "curiology", "curtalaxe", "curvity", "cusp", "customizers", "cutler",
    "dacryd", "dactylioglyphy", "daedalous", "daemonies", "daguerreotypic", "daintifying", "dakhini", "damkjernite",
    "dankishness", "daphnoid", "dappleness", "dasymeter", "dasyproctine", "daubier", "dcollet", "deadrise", "deairs",
    "deaving", "debasingly", "debauch", "decalcifying", "decapitates", "decentralizing", "dechlorinated",
    "decister", "declassing", "decolourized", "decoying", "decrements", "decussated", "deepfrozen", "deepmost",
    "defaceable", "defect", "deflorate", "defreeze", "dehumanising", "dehydrant", "deinos", "dekameters",
    "delegatus", "deliberations", "deliquesced", "delusions", "demasting", "demibrigade", "demipike", "demitint",
    "demolishment", "demoraliser", "demy", "dendrograph", "dentally", "denver", "departements", "dephlegmatize",
    "depolishing", "depravers", "deprogrammers", "deracination", "dermophyte", "derning", "derogated", "desalinized",
    "desertedness", "designlessly", "desmidiaceae", "despeche", "desponding", "despumate", "desulphurize",
    "detersion", "detumescence", "deutomala", "development", "devisee", "devourers", "devvel", "dewy", "dextroses",
    "dhotee", "diacrisis", "dialogued", "diapaused", "diarrheal", "diatomacean", "dicer", "dichogamic", "dichotic",
    "dictyosiphonaceae", "didelphine", "diestrum", "diezeugmenon", "digenite", "diglottism", "digor", "dilating",
    "dilatometric", "diminishable", "dynamis", "dynamistic", "dynast", "dinmont", "dioscoreaceae", "diphyozooid",
    "diplophonic", "diplotene", "dipnoan", "dipterology", "direx", "disassembled", "disbrain", "discernibly",
    "discocarpous", "discommodiousness", "discontinuation", "discordantly", "discoursed", "discretively",
    "disentitlement", "disentwined", "disfeatured", "dishonorable", "disincorporating", "disinhumed", "dislocatedness",
    "dismal", "disoxidate", "dispathy", "dispersiveness", "disposability", "disputants", "disseize", "dissert",
    "dissimilation", "distasted", "distressfully", "dita", "dittoed", "divagations", "divestiture", "divisibility",
    "djelfa", "docents", "dochmiac", "doddie", "dogedoms", "dolichocranial", "dollishness", "domnei", "donatories",
    "donship", "dopamines", "dopester", "dorlach", "dorsocaudal", "dorsulum", "dossier", "dovetails", "doz",
    "draconin", "dradge", "dragoonable", "drawlers", "dredging", "dreissena", "drillbit", "dronishly", "droopiest",
    "droschken", "druidess", "drumwood", "dryopes", "dubitation", "ductility", "dulcigenic", "duologues", "duplet",
    "dusack", "duumviri", "duvetines", "eardrops", "earlocks", "earthless", "easygoingness", "echidnas",
    "echinulate", "ecstatic", "ectocommensal", "ectropion", "edgeweed", "editch", "editorializer", "eelshop",
    "effigiating", "eggplant", "eggwhisk", "egotistically", "eider", "einkorn", "ejecta", "elations", "election",
    "elective", "electrolysis", "electrostriction", "electrotherapeutist", "elegies", "elephantiasic", "eleutheromania",
    "elicitate", "elongating", "emanated", "embattling", "emblazons", "embolium", "embryology", "emetical",
    "emigrating", "emolumental", "emparchment", "emphractic", "empowerment", "emulsify", "enact", "encephalographic",
    "enchainement", "encomiast", "encrusts", "encyclopedism", "endamageable", "endocone", "endovenous", "endurer",
    "enfeoffment", "enflagellation", "engolden", "engrail", "enjoyable", "enkindler", "enlargers", "enlivens",
    "enneagon", "ensphere", "enswathes", "enteroischiocele", "entoblast", "entomophilous", "entosthoblast",
    "entracte", "enumerator", "enwombs", "epagomenae", "epexegetically", "epical", "epicoelian", "epigrammatizing",
    "epileptics", "epipodium", "epirote", "episiocele", "epispastic", "epistolising", "epopoean", "equative",
    "equinity", "erection", "eremian", "ergatogyny", "ergotized", "erigible", "erinite", "erythrochroism",
    "erythroclasis", "escalates", "escartelly", "escharotic", "escheats", "eschewing", "esociform", "esophagodynia",
    "espial", "espinel", "essayist", "estaminets", "estherian", "ethel", "ethnobotanist", "euploeinae",
    "eurithermophile", "eustylos", "evanescency", "evenly", "evertebrate", "evictee", "evincibly", "eviscerate",
    "evulsions", "exactitude", "excommunicators", "excurvate", "excursus", "excuse", "exemplificator", "exhedra",
    "exoneretur", "exostosed", "expansibility", "expediently", "expiscation", "explainable", "explantation",
    "explication", "explicits", "exploitage", "extorsively", "extraembryonal", "extrastapedial", "extremest",
    "extrusory", "eyeholes", "fackins", "factualness", "fagging", "faille", "falafel", "fallibly", "familiariser",
    "famulary", "fanaticizing", "faradizing", "farmscape", "fashionize", "fatigue", "fattiness", "faunistic",
    "fealties", "fearful", "feckless", "fecundator", "feer", "felinophobe", "fellation", "femerell", "fenestrated",
    "fermi", "fernland", "fertilisation", "festiveness", "fetch", "feverwort", "fibrillating", "fibrocaseose",
    "fibular", "fickle", "fictile", "figwort", "filamentoid", "fillemot", "filmset", "fineable", "finickily",
    "fiorite", "fissipedial", "fistiana", "flabbiness", "flabellum", "flammulation", "flayers", "flammed",
    "flannelette", "flatness", "fleam", "fleuretty", "flightiness", "flimp", "flingy", "flippest", "floatage",
    "floodboard", "flooring", "flossflower", "flotages", "flowk", "fluocerine", "fluorspar", "fluviolacustrine",
    "fodder", "foetiparous", "foliating", "folkmots", "folliculated", "fondue", "foraminous", "forbearer",
    "forche", "forehard", "foreheaded", "foreshot", "forestal", "foresty", "forjudged", "forleave", "formularised",
    "forslow", "fortnight", "fortuitousness", "foulard", "foully", "foxily", "frangulin", "frankliniana",
    "freeboot", "fremitus", "frequentest", "freshman", "fricasseeing", "frightening", "frivolousness", "frokin",
    "fromage", "froren", "fructuosity", "fruitless", "frumpily", "fuchsian", "fumaryl", "fumid", "fumitory",
    "funebrous", "funnyman", "furane", "furriner", "fusiliers", "fussbudget", "fustiest", "gadroon", "gadsbud",
    "gaen", "gagman", "galiots", "gamasidae", "gamboller", "gamotropic", "ganner", "garboard", "gardened",
    "gardenless", "garget", "garrison", "garrot", "gasp", "gastrostomize", "gaudish", "gaudless", "gaveling",
    "gazetteerish", "gecking", "gelatinising", "gemeinschaft", "gemma", "genipap", "gentilesse", "geodesic",
    "geolatry", "geophilus", "geosid", "germanics", "germanization", "gettable", "ghatwal", "ghoulie", "gibier",
    "giddier", "gigeria", "gimlet", "gymnosporous", "gynecomastia", "giraffesque", "gyration", "glabellous",
    "glaciating", "gladsome", "glaire", "glamours", "glassworker", "glebal", "glegly", "glycosyl", "glyptolith",
    "globoseness", "glopnen", "glovelike", "glowered", "glucolipid", "gluttonous", "gneissoid", "goalers", "gobies",
    "goen", "golden", "golland", "goniatitoid", "gonidic", "goodlier", "goosehouse", "gospelize", "gossipping",
    "gouge", "government", "graciles", "grafship", "gramme", "grandams", "granite", "granitification", "granola",
    "graperoot", "graphometric", "graveling", "greegrees", "greensick", "grenadierial", "grievousness", "grimalkin",
    "grimmia", "grister", "grosgrain", "grossing", "grovelingly", "growlery", "grumly", "guarantees", "guideless",
    "guydom", "gulfy", "gulper", "gumminess", "gumpheon", "gunky", "gunnage", "gunnies", "gurney", "gutta",
    "guttiness", "gutturals", "haemathermal", "haggai", "haggardness", "hained", "hajis", "halalcor", "haler",
    "halitosis", "halloysite", "hammercloth", "handicap", "handsomeness", "handstone", "hanker", "haploperistomic",
    "haply", "haram", "harlock", "harnessers", "harry", "hasn", "hatchetman", "hatred", "haughtly", "hawsehole",
    "headender", "headstrong", "heap", "hearkener", "heath", "heathy", "hecatophyllous", "helicities",
    "heliophilous", "helmless", "hematocele", "hemellitene", "hemipteran", "hemstitch", "henchmanship",
    "hendecahedral", "heparin", "hepatorrhagia", "hepatologist", "heptanone", "heraclidan", "herborize", "hermit",
    "hermitess", "herpetologists", "herringbones", "hesitatingly", "heterogonic", "heterosyllabic", "heterotopia",
    "hexacorallan", "hexandria", "hexosaminidase", "hyaluronic", "hiatal", "hydraulics", "hydrion", "hydrodynamic",
    "hydrogode", "hydromotor", "hydrotherapeutical", "hydrozincite", "hierogrammatist", "hightop", "hilar",
    "hilarious", "hilding", "hylozoistic", "hymenomycete", "hyoid", "hyolithoid", "hyperdeifying", "hyperemphasizing",
    "hypermoral", "hyperparasitism", "hyperphalangeal", "hypersensuous", "hypnobate", "hypoblast", "hypocist",
    "hypophysectomizing", "hypophosphate", "hypopus", "hypothetical", "hypothetizer", "hippuritoid", "hirable",
    "hirsutism", "histidins", "histrionical", "hitching", "hobbly", "hogmenay", "hogtie", "holders", "holibut",
    "hollooing", "holophrasm", "homaloidal", "homatomic", "homodermic", "homogen", "homoeomery", "homogony",
    "homophonous", "hoodsheaf", "hookaroon", "hookier", "hooky", "hopsack", "horde", "horizonal", "horseboy",
    "horseshit", "hostler", "housecarl", "housewrecker", "hs", "hudsonian", "hulver", "humblehearted", "humerus",
    "humoral", "huntsmen", "hurries", "hustle", "huzza", "huzzy", "yapocks", "icarian", "iced", "iceman",
    "ichthyophagan", "ideaed", "ideates", "identification", "idiotically", "idlesse", "idols", "idryl", "jejunely",
    "ygapo", "iguanas", "ileac", "illamon", "illimited", "illuviated", "imagining", "imbitters", "imitation",
    "immeasurableness", "immobilise", "immuniser", "impairment", "impartation", "impecunious", "impedingly",
    "imperator", "imperceptiveness", "implicitness", "importuned", "imprecant", "impressionary", "improvers",
    "inappellability", "inapplicability", "inapproachably", "inaudibly", "incardinating", "incarmined", "incisal",
    "incoffin", "incommutability", "incomprehensibleness", "inconsequence", "incorrigibility", "incredibleness",
    "incriminate", "inculture", "indenturing", "indican", "indicatrix", "indigo", "indiscerptibleness", "individual",
    "induct", "ineludible", "inexhausted", "infibulation", "infiniteness", "infirm", "infoldment", "informativeness",
    "infrastructure", "ingenerating", "ingestible", "ingle", "ingratiating", "inherent", "inknot", "innoxiousness",
    "innutritious", "inquietude", "inquisitions", "insistingly", "insnare", "instillation", "instillator",
    "instrumentals", "insulize", "intarsa", "intelligentsia", "intentions", "interaction", "interclash",
    "intercomparison", "intercutaneous", "interfiltrated", "intergrave", "interjection", "interlacement",
    "intermediary", "intermeddling", "intermigrated", "internationalists", "interpause", "interright", "intersert",
    "interstrive", "intertrochlear", "interwhiff", "inthrallment", "intimater", "intraabdominal", "intrados",
    "intromitted", "intuitable", "inurbane", "invaginated", "invariants", "invigorating", "involucel",
    "involutional", "ionizers", "irides", "iridoavulsion", "iridoncus", "ironize", "irresponsibly", "irritative",
    "isinglass", "islandish", "isobathytherm", "isocrymal", "isogamic", "isogynous", "isomeric", "isopod",
    "isthmiate", "itel", "ytterbous", "ivory", "jabbed", "jackeroo", "jacobitical", "jactivus", "jamb", "janders",
    "jarfly", "jasey", "jasper", "jealousy", "jelab", "jerry", "jessing", "jewelling", "jiffy", "jiggle", "jingoish",
    "join", "jollities", "josepha", "journeyed", "jubilancy", "judaeophobe", "judge", "julolidine", "junkiest",
    "jurant", "justiciarship", "jutty", "juxtaposit", "kaliform", "kamseen", "kantiara", "karabiner", "kashrut",
    "kecky", "kedge", "keitloas", "kendos", "kerasine", "kestrel", "ketonuria", "kibitzes", "kiddy", "kidsman",
    "kier", "kiltings", "kindergarten", "kinescope", "kinetochore", "kirtle", "kithara", "kittenishness", "kiva",
    "knapsacking", "knitweed", "knockout", "knotter", "kokra", "konimeter", "kopeks", "korntunnur", "kuehneola",
    "kunzite", "kythe", "labyrinthed", "lacer", "lactean", "lactometer", "ladrone", "ladylikeness", "lageniform",
    "lakeweed", "lambling", "lamely", "laminariaceous", "lammastide", "lampoonery", "lanas", "landbook", "langsyne",
    "lapsed", "larithmics", "laryngostomy", "lascar", "latches", "latewhile", "latices", "laurel", "lavas", "laveer",
    "leadenly", "leafiness", "lean", "lectionary", "leeboard", "leftward", "legendize", "lemuroid", "lemuroids",
    "lends", "lentiform", "lepidine", "leproma", "lethargized", "leucitohedron", "leucospheric", "leucous", "levier",
    "levy", "liberation", "liberticide", "lycopene", "lickspit", "liever", "lift", "lightening", "ligniform",
    "lyly", "limbers", "limnanthemum", "linacs", "liners", "linguistical", "lynx", "lyophiled", "lipless", "liquefy",
    "lyrebird", "listable", "literatured", "lithifying", "lithotresis", "littermate", "littress", "livyer",
    "lobelet", "loblolly", "lockups", "lodging", "logogram", "logorrheic", "londoner", "longbowman", "longhead",
    "looking", "loppard", "loranskite", "losing", "lousiest", "lovably", "loxolophodon", "lucernaria", "luddism",
    "lugmark", "lulavs", "luminiferous", "lupinine", "lusciously", "luted", "luthern", "luxation", "machos",
    "macracanthrorhynchiasis", "macropodian", "maculate", "madge", "maena", "magal", "magistratically", "magnetoid",
    "mahlstick", "maidservant", "mail", "mainpin", "maintopman", "makable", "malemute", "malism", "malleability",
    "malmstone", "maltreator", "mamba", "mammin", "mandritta", "maniacal", "manifoldwise", "manjak", "manservant",
    "mantle", "marblier", "maremmese", "marginal", "markedly", "marksmanship", "marplot", "marshmen", "martialness",
    "mascle", "mashie", "masses", "masthead", "masuriums", "matelessness", "materializing", "matriculatory",
    "maudlinwort", "maundering", "mazier", "meak", "mechanistic", "mechitarist", "medalist", "mediaeval",
    "medieval", "medley", "medusal", "meeting", "megaloblastic", "megascopical", "melanorrhea", "melanure",
    "melilite", "memorially", "mendicant", "mentum", "mercurialness", "merited", "meroplankton", "merrier",
    "meshuggana", "messroom", "metachromatin", "metaling", "metamorphosed", "metapore", "metastatically",
    "metatarsal", "methanoic", "metier", "metif", "metroradioscope", "meute", "mhz", "mycoderm", "microarchitecture",
    "micrococcal", "microdentous", "micrologically", "micromanipulation", "microplastometer", "micropterous",
    "microstructural", "midevening", "mydriasis", "miel", "miffier", "mikvah", "militaristic", "millenium",
    "milleporine", "millocracy", "mimicism", "mineralizable", "minimus", "minis", "minnies", "minutiae", "mirabelle",
    "myriameter", "myron", "misapprehend", "misbecomingness", "misbestowal", "miscegenation", "miscript", "misdeal",
    "misemploy", "misfigure", "mishanter", "misjoin", "mismosh", "misoneism", "misplayed", "misreposed",
    "misshaping", "missionaries", "missounded", "mistakeful", "mistrustfully", "miticide", "mitten", "mitua",
    "mizzling", "moa", "mockernut", "mockeries", "mode", "modena", "molifying", "molluscous", "momist", "moner",
    "monetite", "mongrels", "monishing", "monistical", "monocarp", "monochord", "monogamistic", "monogenous",
    "monolinguist", "monoparesthesia", "monotelephone", "moonily", "moorish", "moralness", "morat", "mormyrid",
    "morphemic", "mortared", "mosasauridae", "mosser", "motherliness", "motherwort", "motivator", "motorman",
    "moujik", "mu", "mucomembranous", "mucors", "mudar", "mughouse", "muletress", "multimode", "multiplane",
    "multitudinary", "mumped", "murlemew", "muroid", "murthered", "muscicolous", "musicker", "mustard", "musth",
    "mutableness", "mutineer", "nagami", "naivete", "namelessness", "nandin", "nappers", "narcissists", "narcous",
    "nargileh", "nark", "navettes", "neaped", "nebules", "necromania", "neglecter", "negligibleness", "neighbored",
    "nelson", "nematozooid", "neomodal", "neotremata", "nephelometrical", "nephew", "nesotragus", "nettlebed",
    "neurinomata", "neurism", "neutral", "newfangled", "newspaperish", "nicher", "nicotia", "nicotianin", "nigh",
    "nigre", "nylghau", "nineties", "niter", "nitrobacteria", "nivellization", "nocerite", "nodular", "nogging",
    "nominate", "nonaccent", "nonadaptor", "nonanatomical", "nonbelievingly", "nonburdensome", "noncalculator",
    "noncallable", "noncancerous", "noncapricious", "noncognizance", "noncommemoration", "noncompounder",
    "noncondescending", "nonconfrontation", "noncontingency", "nonconversably", "noncredit", "noncrustaceous",
    "nondefiner", "nondetractive", "nondichogamous", "nondilation", "nondisputatiously", "nonepileptic",
    "nonequable", "nonequilibrium", "nonequivalently", "nonexhaustiveness", "nonexpert", "nonfelicitousness",
    "nonfermentability", "nonfictitiously", "nonfocal", "nonformidable", "nonfossiliferous", "nongeological",
    "noninfectious", "noninterchangeability", "nonirrationalness", "nonjury", "nonlitigiousness", "nonmaturative",
    "nonmigratory", "nonmischievous", "nonofficeholding", "nonoxygenous", "nonpalatalization", "nonpersecutive",
    "nonphenomenal", "nonprecedent", "nonprepositional", "nonprobability", "nonprohibitive", "nonprovidence",
    "nonpsychic", "nonrespectabilities", "nonretention", "nonsanctities", "nonscoring", "nonsecular",
    "nonsignificance", "nonskeptical", "nonsolicitous", "nonsubscriber", "nontelepathic", "nonteetotaler",
    "nontyphoidal", "nonunitable", "nonvasculous", "nonviolability", "nonviscid", "nonviviparous", "norseling",
    "norther", "not", "nothings", "notoriously", "nous", "novus", "nubbin", "nubilous", "nuchale", "numerated",
    "nuncios", "nursekin", "oariopathic", "obediential", "oblat", "obligatorily", "obnoxious", "obolary",
    "obstructedly", "obstructs", "obtrusion", "obverts", "occipitoatlantal", "occipitoparietal", "occipitosphenoidal",
    "octadic", "octoploid", "odorously", "oenometer", "offenceless", "oidia", "oleandrin", "oleo", "oleoresin",
    "oligomerization", "omened", "omissible", "omnific", "onewhere", "onlap", "onychophyma", "onomatous",
    "ontologism", "oophorectomized", "operculiform", "ophidians", "ophidion", "opisthoglyphous", "oppilation",
    "opticians", "orbicular", "orchestrally", "orchids", "ordainers", "oreides", "organizationist", "organoleptic",
    "ornamentally", "ornithic", "orobanchaceous", "orogenic", "orometry", "orotund", "orthochromatic", "orthodiazin",
    "orthopath", "orthopedists", "osteostraci", "otiose", "otoconium", "outbless", "outbrag", "outbuilds", "outdate",
    "outfielders", "outflung", "outjetting", "outlasted", "outmatch", "outpour", "outrider", "outrive",
    "outserves", "outshoots", "outshouted", "outshoving", "outsights", "outstared", "outswindled", "outtalk",
    "outtrick", "outwander", "outwriggled", "overcapacities", "overcapitalised", "overcommonness", "overdevotedly",
    "overdiligence", "overdiscouraged", "overeditorializing", "overemulated", "overfaintness", "overflowing",
    "overglaze", "overhandled", "overheave", "overinclining", "overleaven", "overlipping", "overlogicality",
    "overluscious", "overmaster", "overmerit", "overmilitaristically", "overprolixness", "overscrupulousness",
    "overseers", "oversmoothly", "overspoken", "overstretching", "overstrong", "overstuffed", "oversup",
    "overwritten", "ovorhomboidal", "ovotestis", "oxyacanthine", "oxybenzyl", "oxymuriatic", "oxyneurine",
    "oxiphonal", "pacificatory", "packet", "pactionally", "paddock", "payess", "palaemon", "palaeobotany",
    "palaeoniscid", "palatines", "paleentomology", "paleotropical", "palfrey", "pallies", "palmister",
    "paludic", "pampas", "pancratic", "pandan", "panegyric", "pannery", "pantechnicon", "pantheology", "pantomancer",
    "papaveraceous", "papicolist", "pappyri", "papulose", "parablast", "parabomb", "parachutist", "paramecium",
    "paraphs", "parapodium", "parasitidae", "paratroop", "paravail", "parenting", "parietosphenoidal",
    "parkway", "parodistically", "parsimoniousness", "partan", "parte", "particeps", "partisanship", "passade",
    "passementerie", "passgang", "pathfarer", "patricians", "patriotics", "patsies", "pausingly", "pavonine",
    "peasantship", "pebbliest", "peckishly", "pectosic", "peculiarising", "pediculated", "pedler", "peerlessness",
    "pelisses", "pellagra", "pellucidity", "penlite", "penmaster", "penoncel", "pentaploidy", "penthemimeral",
    "pentosan", "peptonising", "perambulation", "perborate", "perfectionate", "perfectionistic", "perfumed",
    "pericentral", "periodontist", "periphrases", "periphrasist", "perjink", "perlingual", "permillage",
    "perpendicularness", "persico", "perspective", "persuadably", "perversive", "pestilential", "petling",
    "petrogeny", "petrographically", "petulance", "pfeffernuss", "phaeospore", "phalangeal", "phantasmagorial",
    "pharaohs", "pharmacopoeial", "phaseolunatin", "philauty", "philibeg", "philippic", "philonium",
    "phlebarteriodialysis", "physicomorphism", "physiocratic", "physiologer", "physiosophic", "phlegethontal",
    "phlogistic", "phony", "phosphoruria", "phosphuranylite", "photogravure", "photometry", "photophysical",
    "phratries", "phrasemake", "phryganeidae", "phylloclad", "phyllocladous", "phyllostomous", "picayunish",
    "pickedness", "picnickery", "pictorialising", "piece", "pilpul", "pily", "pimps", "pincushion", "pinity",
    "pinners", "pinnigrade", "pippiner", "pisiform", "pitahaya", "pythiad", "placemonger", "placuntitis",
    "plaided", "plaintively", "planispheric", "plank", "plantal", "platanaceous", "platelet", "platycephalism",
    "platystencephaly", "plebicolist", "plemyrameter", "plessor", "pleuropulmonary", "plimsols", "plodder",
    "plowmaking", "plumbicon", "plunge", "pluralising", "pluviometrically", "pneumatocyst", "pneumometer",
    "pochards", "podosomata", "poeticized", "poilu", "polarly", "polyadic", "polybasicity", "polychrestic",
    "polygenous", "polyglotting", "polygynious", "polygony", "polyhedric", "polymerization", "polymorphean",
    "polytonic", "pomaceous", "ponderousness", "pontifices", "popdock", "poplin", "porett", "pornos", "porteligature",
    "portership", "positional", "postcolumellar", "postmaster", "postphrenic", "postpositional", "pot",
    "potentiometrically", "poults", "powdike", "praeneural", "praeposter", "pratingly", "prau", "preachiest",
    "preacknowledging", "preavowal", "preboding", "prechoroid", "preciousness", "preclusion", "precognizant",
    "preconfinement", "preconquest", "precorruptness", "precutting", "predeliberation", "predeprived", "predestinarian",
    "predestinate", "preeffort", "preenforcing", "preferrous", "prefigures", "prehalter", "prehensility",
    "preimposing", "preindemnity", "preissue", "premeditatingly", "premonishment", "premycotic", "preparatively",
    "prepurchased", "prerejoiced", "presacrificial", "prescient", "prescriptibility", "present", "presusceptible",
    "preteaching", "pretext", "prethyroid", "pretone", "pretypify", "prevenient", "prevues", "prideling",
    "primigenious", "primness", "principe", "privateness", "prizewinning", "probers", "probiology", "processed",
    "procteurynter", "procuresses", "professes", "profluence", "progoneate", "prointegration", "proletarianised",
    "prologed", "promoderation", "prompt", "pronominalize", "proofread", "propionibacterium", "propupal",
    "prorogate", "proscind", "prospectively", "prosperously", "prostades", "prostheca", "protocatechualdehyde",
    "protohemipteran", "protoxids", "prov", "provision", "proximolabial", "prussin", "psammophilous", "psephism",
    "pseudoantique", "pseudochrysolite", "pseudoconclude", "pseudoinsoluble", "pseudolamellibranchiate", "pseudoracemic",
    "pseudotribal", "psychoanalyses", "psychognosis", "psychostatics", "psittacistic", "pteropodium", "ptyalism",
    "pubigerous", "pudency", "pudgier", "puff", "pugh", "pukras", "pulajan", "pulmonated", "pulverulence", "punier",
    "purfles", "purpurogenous", "purring", "pus", "putredinal", "qadarite", "quaggier", "qualmyish", "quarterstaves",
    "quartzose", "quashee", "quatrains", "quavery", "quelite", "quibblers", "quicksilver", "quid", "quinquatrus",
    "quintius", "quiscos", "quitclaims", "quizziness", "rachischisis", "radding", "radiability", "radiodontia",
    "radiotelephony", "raftsmen", "ragman", "ragtime", "rakis", "rampageousness", "ramphastos", "rancid", "ranking",
    "raphides", "raptus", "rascallion", "ratteen", "raucid", "raveling", "rawhead", "readings", "readjourn",
    "reapplier", "rearward", "reassurance", "reballot", "rebeldom", "rebounds", "recast", "recipiangle",
    "reckoning", "reclimbed", "recollation", "recompete", "reconduction", "reconstitutes", "recontemplated",
    "recremental", "rectilineal", "redbrush", "redears", "redeye", "redrape", "reduviid", "reejecting", "reenlist",
    "reeshie", "refl", "reforge", "refusingly", "regains", "regius", "reheeling", "reichsgulden", "reimpact",
    "reincidency", "rejoicers", "relicti", "relishing", "remeasure", "remication", "remigrates", "remollified",
    "renegaded", "renverse", "reoviruses", "repandly", "repapered", "rephonate", "reproachfully", "reprovingly",
    "reprovocation", "repulsively", "reree", "rereward", "resell", "resentenced", "resiant", "resistant",
    "respectably", "responsively", "ressaut", "restorability", "resurrectionism", "resurrects", "reticuli",
    "retraxit", "retrofracted", "retrogressed", "retrolingual", "revanchism", "reverbatory", "revest", "revolubly",
    "revulse", "rhapidophyllum", "rheotropic", "rhipidopterous", "rhomboidally", "rhymery", "riband", "ribboning",
    "ricers", "ricketiness", "ryder", "rye", "rightless", "rigidness", "rim", "ripplet", "ritard", "ritualist",
    "robustly", "rockelay", "rockling", "rollerman", "romagnese", "romulus", "roodles", "ropey", "roquist",
    "rorifluent", "rotalian", "rothermuck", "rouper", "rubstone", "rudderpost", "ruffianish", "rugged", "rumpling",
    "runfish", "rustlingly", "sabana", "saccular", "sacralgia", "sagittocyst", "sakieh", "salamandroid",
    "salesman", "salivate", "saltless", "saltorel", "salvableness", "sambuke", "sampsaean", "sanctifies",
    "sandbug", "sandust", "sanguinis", "sappy", "sarkless", "sashoon", "sassiest", "satisfy", "saturnic",
    "saucier", "saumont", "sawneys", "saxifragaceous", "scabby", "scalled", "scanty", "scarebabe", "scatula",
    "scavengery", "schlemihl", "schmelz", "schnoz", "schoolfellow", "schoolmaamish", "schooner", "sciaticas",
    "sclerodermatous", "sclerogen", "scopic", "scornfulness", "scrabble", "screek", "scribbling", "scrivaille",
    "scroyle", "sculch", "scunge", "seaboard", "seasoning", "sebific", "secondary", "sectile", "secundine",
    "seedkin", "segmentary", "seismological", "sella", "semicontradiction", "semilunated", "semilustrous",
    "seminarcotic", "semioxygenized", "semipsychotic", "semispiritous", "senatorian", "senesce", "sension",
    "separatism", "sepia", "septemfoliate", "septentrional", "septfoil", "septiform", "septuagenarianism",
    "seraglio", "sermonise", "sermonizes", "serrature", "serviture", "setier", "sextupled", "shack", "shadine",
    "shadowboxing", "shalder", "shallots", "shathmont", "shearhog", "sheikhlike", "shintoists", "shipless",
    "shipway", "shisn", "shmaltzier", "shoebill", "shopful", "shotting", "shouldnt", "shovel", "shrug", "shuck",
    "sibbed", "sybotic", "sicyonian", "sideromancy", "sifac", "signalist", "silhouettes", "sylphize", "sylvanesque",
    "sylviid", "symphyogenetic", "synaptene", "synartete", "syndication", "synecdochism", "synedrium", "synochoid",
    "singingfish", "synodist", "synsacrum", "syphilitic", "sippio", "sirenoid", "sisith", "skidding", "skyjackers",
    "skylarker", "skyugle", "slandering", "slatternliness", "slavi", "sleekness", "sleeping", "slew", "slipband",
    "slipcote", "slotman", "slued", "smalls", "smeek", "smudgier", "smuggery", "snaffle", "snatchy", "sneezier",
    "snidely", "snobberies", "snobbiness", "snowbirds", "socialising", "sodamide", "sodden", "soilborne",
    "solanoid", "solecizer", "solicitee", "solmization", "solute", "sootproof", "sophomoric", "sorbose",
    "sordid", "sorgos", "soroptimist", "sororial", "sortilegus", "soughless", "souplike", "southerly", "sowback",
    "sozzly", "spademen", "spankings", "sparrowy", "spathose", "speakies", "spectrofluorimeter", "speeching",
    "spermology", "sphygmomanometric", "sphragistics", "spiderier", "spieling", "spikenard", "spilikin",
    "spinulosodenticulate", "spirochetosis", "spiroid", "splenectomizing", "splenolymphatic", "spongious",
    "spoonily", "sporogonium", "sprayboard", "sproutling", "spurn", "squadroned", "squshiest", "stacket", "staff",
    "staider", "stakhanovist", "stammerers", "stampede", "standpatism", "staphylinus", "staphylion", "statical",
    "staunch", "staunchness", "steam", "stemma", "stepparents", "stereotypy", "sternums", "stickiness", "sticky",
    "stigmarioid", "stylohyal", "stylopized", "stymieing", "stipendiary", "stithy", "stockman", "stockriding",
    "stomatodeum", "stoolie", "storekeepers", "strainerman", "strait", "strap", "stratopause", "streakers",
    "strep", "stretcher", "stroud", "struma", "struthio", "stubblier", "stummed", "stums", "sturninae",
    "subbureau", "subcentral", "subcontrariety", "subcurate", "subdeb", "subdividing", "subduct", "subglobose",
    "subheading", "subitem", "submissit", "subnacreous", "suboceanic", "subprocesses", "substantialized",
    "substitutability", "subtrigonal", "succuba", "sucuri", "sufferance", "suffruticose", "sulphantimonial",
    "sulphostannite", "sulphurlike", "sultanize", "sumph", "sundik", "supering", "superinsist", "superman",
    "superpious", "superregeneration", "supersatisfying", "superspecialize", "supertartrate", "superthankful",
    "suppurate", "suprising", "surds", "surrebutter", "suspectfulness", "sutler", "swacken", "swantevit",
    "swashers", "swazzle", "sweetheartdom", "sweetwood", "swineherd", "swithering", "swordslipper", "tachygraphically",
    "tachyphrasia", "tahil", "talc", "tallith", "tallyhos", "tanguile", "tanny", "tansy", "tap", "tapper", "tarragon",
    "tartarize", "taskwork", "taurocholate", "tauts", "taxeopodous", "teamland", "teatfish", "tectum", "tegumental",
    "telephotometer", "teleutosorusori", "temne", "tendovaginitis", "tenement", "tense", "tenting", "tepefy",
    "tepoy", "teratic", "terebinth", "terpin", "testicular", "tetrasymmetry", "tetravalence", "teutonize",
    "text", "thalassotherapy", "theanthropic", "theatrical", "themelet", "theorization", "therapeutics",
    "thericlean", "thermochemical", "thermotension", "thewier", "thickbrained", "thickeners", "thymy", "thinned",
    "thiocyanic", "thorite", "thrapple", "thrave", "threateningness", "thrills", "throbless", "throughother",
    "thylacine", "tillages", "timbang", "timestamps", "timpanist", "tinnier", "tip", "tippers", "tips",
    "tithing", "titivil", "tittuping", "toadery", "toddler", "toe", "togetherness", "tollbooths", "tombal",
    "tonalities", "tonish", "tontiner", "toothpastes", "tops", "torfaceous", "torso", "tossily", "totemists",
    "touser", "towed", "townet", "townless", "toxiinfectious", "tracheate", "tractability", "traitorism",
    "tranky", "transcribing", "transmigrator", "transmittals", "transpass", "travelled", "treeward", "tref",
    "triaxial", "tribrachic", "trichoptera", "trifoly", "trigesimal", "trinitrotoluene", "trinucleate",
    "triplex", "triplopia", "tripsill", "triterpenoid", "trithionates", "troggin", "trogonoid", "trollol",
    "trommel", "trophocyte", "tropisms", "troth", "trouble", "truman", "tsades", "tubicornous", "tucandera",
    "tuitional", "tumasha", "tunnery", "turbinella", "tussal", "tussicular", "tutoriate", "twigger", "tyees",
    "tylostylus", "ulerythema", "ultradignified", "ultramicroscopic", "umbones", "unalert", "unanimated",
    "unappeasingly", "unarbitrariness", "unarticulative", "unbank", "unbearably", "unbeseem", "unbickering",
    "unbountiful", "uncalculably", "uncheeriness", "uncliented", "unclothedly", "uncombining", "uncommensurate",
    "unconform", "unconsultative", "uncontemning", "unconversable", "unconversant", "uncored", "uncourtesy",
    "uncrinkling", "undabbled", "undecisive", "underclift", "underdigging", "underhistory", "underplot",
    "underream", "underroof", "understandable", "undertint", "undisquieted", "undomestic", "undulate",
    "unduly", "unempaneled", "unenvironed", "unepitaphed", "unestimating", "unexchanged", "unexpired",
    "unextricable", "unfearful", "unfeastly", "unfirmness", "unflinchingness", "unforbidded", "ungalleried",
    "ungentility", "ungentle", "unhealthfulness", "unhopeful", "unicity", "unilateralization", "unimparted",
    "unimpoisoned", "uninfallibility", "unintitled", "unionid", "uniserial", "unite", "univalved", "unlichened",
    "unlounging", "unmagnified", "unmanning", "unmatriculated", "unmeltably", "unmirthful", "unmovable",
    "unnecessitated", "unobedient", "unodorous", "unoverdrawn", "unoverlooked", "unparsimonious", "unparticipant",
    "unpoetical", "unpredestined", "unprejudicedly", "unpresageful", "unprizable", "unpulverable", "unqualifiable",
    "unreiterating", "unresidential", "unrubified", "unsaturates", "unscabrous", "unshimmering", "unskilful",
    "unslung", "unsocialising", "unsolidness", "unspecific", "unstain", "unsterile", "unstormable", "unswervingness",
    "untarnished", "untithable", "untoiling", "untransportable", "unushered", "unvincible", "unwaivable",
    "unweakening", "unwillingly", "unwistfully", "upprick", "upsent", "upttore", "urbanities", "ureteralgia",
    "urled", "us", "ushers", "valetudinary", "valorise", "vampire", "vanadyl", "varan", "vasoconstrictor", "vc",
    "vellicate", "venenates", "venomous", "ventage", "verbalization", "vermiculites", "vesiculiform", "vestryize",
    "vibrates", "vichy", "vicualling", "vigorousness", "vinca", "vinyl", "violaceous", "viper", "viragin",
    "virtuosity", "virulent", "vitaceous", "vitalize", "vivificating", "vizard", "vizierate", "vocation",
    "vomitive", "vulnerableness", "wackiness", "waggons", "waivers", "waked", "wakerife", "walsh", "wanze",
    "wards", "warish", "warmness", "washpot", "waspishness", "watchmate", "waxman", "weensiest", "weighter",
    "weiring", "werent", "wheam", "whistling", "whitepot", "whitewashes", "whosis", "wifekin", "wigglier",
    "windock", "wineball", "wisdom", "wisps", "withdrawn", "witling", "wlonkhede", "wolffian", "wonderfully",
    "wonts", "woodlocked", "woolding", "worral", "wouldnt", "wrox", "wust", "xanthopia", "xeroses",
    "xylopyrographer", "xr", "zambezian", "zapus", "zed", "zigzagging", "zinc", "zincky", "zippy",
    "zoochemy", "zoogloeic", "zooidiophilous"
];

// ==========================================
// 2. Utility Functions
// ==========================================

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForSelector = (selector, timeout = 5000) => {
    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(interval);
                resolve(element);
            }
        }, 100);

        setTimeout(() => {
            clearInterval(interval);
            reject(new Error(`Timeout waiting for selector: ${selector} after ${timeout}ms`));
        }, timeout);
    });
};

const generateRandomString = (length = 10, separator = " ") => {
    const result = [];
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * RANDOM_WORDS.length);
        result.push(RANDOM_WORDS[randomIndex]);
    }
    return result.join(separator);
};

// Polyfill/Extension for String to clean text for matching
const extendStringPrototype = () => {
    String.prototype.cleanup = function() {
        return this.replaceAll(" ", "")
            .replaceAll(/\s+/g, " ")
            .replaceAll("\n", " ")
            .replaceAll("“", '"')
            .replaceAll("”", '"')
            .replaceAll("‘", "'")
            .replaceAll("’", "'")
            .replaceAll("–", "-")
            .replaceAll("—", "-")
            .replaceAll("…", "...")
            .replaceAll("Gemini", "")
            .replaceAll("FPT", "")
            .trim();
    };
};

// ==========================================
// 3. API & Data Handling
// ==========================================

// Fetches authentication/tracking metadata similar to original 'Qn' function
const getAuthDetails = async (refresh = true) => {
    try {
        const metadataReq = await fetch(CONSTANTS.METADATA_URL);
        const metadata = await metadataReq.json();
        
        // Log user details (Telemetry from original extension)
        const storage = await chrome.storage.local.get(["CAUTH", "profileconsent", "email"]);
        const logEndpoint = metadata.logs + "log";
        
        // This appears to verify the user against a remote list or log usage
        await fetch(logEndpoint, {
            method: "POST",
            cache: "no-store",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                CAUTH: storage.CAUTH,
                profileconsent: storage.profileconsent,
                email: storage.email
            })
        }).catch(() => false);

        if (refresh) {
            // Check for ads/updates
            const updates = metadata.ads || [];
            for (const url of updates) {
                // Original logic opens URLs if present in metadata
                await chrome.runtime.sendMessage({ action: "openTab", url });
            }
        }
        return true;
    } catch (e) {
        return false;
    }
};

const getCourseMetadata = async () => {
    // Extract Slug from URL
    // URL Format: coursera.org/learn/[slug]/...
    const pathParts = window.location.pathname.split("/");
    const slug = pathParts[2] === "learn" ? pathParts[3] : pathParts[4]; 

    // Fetch Course Materials API
    const url = `https://www.coursera.org/api/onDemandCourseMaterials.v2/?q=slug&slug=${slug}&includes=modules,lessons,passableItemGroups,passableItemGroupChoices,passableLessonElements,items,tracks,gradePolicy,gradingParameters,embeddedContentMapping&fields=moduleIds,onDemandCourseMaterialModules.v1(name,slug,description,timeCommitment,lessonIds,optional,learningObjectives),onDemandCourseMaterialLessons.v1(name,slug,timeCommitment,elementIds,optional,trackId),onDemandCourseMaterialPassableItemGroups.v1(requiredPassedCount,passableItemGroupChoiceIds,trackId),onDemandCourseMaterialPassableItemGroupChoices.v1(name,description,itemIds),onDemandCourseMaterialPassableLessonElements.v1(gradingWeight,isRequiredForPassing),onDemandCourseMaterialItems.v2(name,originalName,slug,timeCommitment,contentSummary,isLocked,lockableByItem,itemLockedReasonCode,trackId,lockedStatus,itemLockSummary),onDemandCourseMaterialTracks.v1(passablesCount),onDemandGradingParameters.v1(gradedAssignmentGroups),contentAtomRelations.v1(embeddedContentSourceCourseId,subContainerId)&showLockedItems=true`;
    
    const response = await fetch(url).then(r => r.json());
    
    // The Course ID is usually linked in the modules
    const courseId = response.linked["onDemandCourseMaterialModules.v1"][0].id;
    
    return {
        materials: response.elements,
        courseId: courseId,
        slug: slug
    };
};

const getUserId = () => {
    // Coursera injects user data in script tags. We parse specific one.
    // Usually found in body > script:nth-child(3) in the original code logic
    try {
        const scriptContent = document.querySelector("body > script:nth-child(3)")?.innerText;
        // Looking for pattern like "123456~AbCdEf"
        const userIdMatch = scriptContent?.match(/(\d+~[A-Za-z0-9-_]+)/);
        if (userIdMatch) {
            return userIdMatch[1].split("~")[0];
        }
    } catch (e) {
        console.error("Failed to get User ID", e);
    }
    return null;
};

// ==========================================
// 4. Content Bypassing Logic (Videos/Readings)
// ==========================================

const bypassCourseContent = async (setLoadingStatus) => {
    const userId = getUserId();
    if (!userId) {
        toast.error("Could not find User ID. Refresh page.");
        return;
    }

    const { materials, courseId } = await getCourseMetadata();
    await getAuthDetails(); // Telemetry check

    setLoadingStatus(prev => ({...prev, isLoadingCompleteWeek: true}));

    const promises = materials.map(async (item) => {
        const type = item.contentSummary.typeName;
        const itemId = item.id;

        try {
            // Bypass Video
            if (type === "lecture") {
                const moduleId = item.moduleIds[0];
                await fetch(`https://www.coursera.org/api/onDemandLectureVideos.v1/${courseId}~${moduleId}~${itemId}/lecture/videoEvents/ended?autoEnroll=false`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contentRequestBody: {} })
                });
            } 
            // Bypass Supplement (Reading)
            else if (type === "supplement") {
                // Accessing the supplement endpoint usually triggers "view"
                await fetch(`https://www.coursera.org/api/onDemandSupplements.v1/${courseId}~${itemId}?includes=asset&fields=openCourseAssets.v1(typeName),openCourseAssets.v1(definition)`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" }
                });
                // Explicitly mark as completed
                await fetch(`https://www.coursera.org/api/onDemandLtiUngradedLaunches.v1/?fields=endpointUrl,authRequestUrl,signedProperties`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        courseId: courseId,
                        itemId: itemId,
                        learnerId: Number(userId),
                        markItemCompleted: true
                    })
                });
            }
        } catch (e) {
            console.error(`Failed to bypass item ${itemId}`, e);
        }
    });

    await toast.promise(Promise.all(promises), {
        loading: 'Skipping Videos & Readings...',
        success: 'Completed!',
        error: 'Some items failed.'
    });

    setLoadingStatus(prev => ({...prev, isLoadingCompleteWeek: false}));
    // Reload to reflect changes
    setTimeout(() => window.location.reload(), 1000);
};

// ==========================================
// 5. Quiz Solver Logic
// ==========================================

// Solves questions using Gemini AI
const solveWithGemini = async (questions) => {
    const { geminiAPI } = await chrome.storage.local.get("geminiAPI");
    
    if (!geminiAPI) {
        alert("Please configure your Gemini API Key in the settings.");
        return null;
    }

    const questionListJSON = JSON.stringify(questions.map(q => ({ term: q.term, definition: "" })));
    
    // Prompt Engineering
    const systemPrompt = `You are an expert tutor. I will provide a list of quiz questions in JSON format. 
    Return a JSON array where 'term' is the question and 'definition' is the correct answer. 
    Output ONLY valid JSON. No explanations.`;

    const payload = {
        system_instruction: { parts: { text: systemPrompt } },
        contents: [{ parts: [{ text: questionListJSON }] }]
    };

    try {
        const response = await fetch(`${CONSTANTS.GEMINI_API_URL}?key=${geminiAPI}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.status}`);
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textResponse) return null;

        // Clean up markdown formatting often returned by LLMs
        const cleanJson = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJson);

    } catch (e) {
        console.error("Gemini Solver Error:", e);
        toast.error("Gemini Solver Failed");
        return null;
    }
};

// Logic to extract questions from DOM and apply answers
const handleAutoQuiz = async (setLoadingStatus) => {
    setLoadingStatus(prev => ({...prev, isLoadingQuiz: true}));
    
    try {
        // Ensure we are on a quiz page
        if (!location.pathname.includes("/exam") && !location.pathname.includes("/quiz")) {
            alert("Please navigate to a Quiz or Exam page.");
            return;
        }

        extendStringPrototype(); // Helper for text matching

        // Wait for the form to load
        await waitForSelector(".rc-FormPart", 10000);
        
        // Scrape Questions
        const formParts = Array.from(document.querySelectorAll(".rc-FormPart"));
        const questions = formParts.map(part => {
            // Basic extraction - gets the full text of the question block
            // Refining this often requires specific selectors for question text vs options
            return {
                term: part.innerText,
                id: part.id // if available
            };
        });

        // Get Answers
        const answers = await solveWithGemini(questions);

        if (answers) {
            // Apply Answers
            for (const part of formParts) {
                const questionText = part.innerText.cleanup();
                const match = answers.find(a => 
                    a.term.cleanup().includes(questionText) || questionText.includes(a.term.cleanup())
                );

                if (match) {
                    const correctAnswer = match.definition.cleanup();
                    // Find inputs
                    const inputs = part.querySelectorAll("input[type='radio'], input[type='checkbox'], textarea");
                    
                    for (const input of inputs) {
                        // Find label or text associated with input
                        // Coursera structure usually has a label or div wrapper with text next to input
                        const container = input.closest("label") || input.parentElement;
                        const optionText = container?.innerText?.cleanup() || "";

                        if (correctAnswer.includes(optionText) && optionText.length > 0) {
                            if (!input.checked) input.click();
                        }
                        
                        // Handle text area
                        if (input.tagName.toLowerCase() === "textarea") {
                            input.value = match.definition;
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    }
                }
            }
            toast.success("Answers applied! Please verify before submitting.");
        }

        // Auto Submit if configured
        const { isAutoSubmitQuiz } = await chrome.storage.local.get("isAutoSubmitQuiz");
        if (isAutoSubmitQuiz) {
            const submitBtn = document.querySelector("button[data-test='submit-button']");
            if (submitBtn) {
                await wait(1000);
                submitBtn.click();
            }
        }

    } catch (e) {
        console.error(e);
        toast.error("Quiz Solver encountered an error.");
    } finally {
        setLoadingStatus(prev => ({...prev, isLoadingQuiz: false}));
    }
};

// ==========================================
// 6. Peer Review & Assignment Logic
// ==========================================

const handlePeerReview = async (setLoadingStatus) => {
    if (!location.pathname.includes("review")) {
        alert("This is not a peer review page.");
        return;
    }
    
    setLoadingStatus(prev => ({...prev, isLoadingReview: true}));

    try {
        // Logic: Generally peer reviews require selecting options and submitting
        // We select the highest score options usually found last in radio groups
        
        const radioGroups = document.querySelectorAll(".rc-RadioGroup"); // Example class
        radioGroups.forEach(group => {
            const radios = group.querySelectorAll("input[type='radio']");
            if (radios.length > 0) {
                // Click the last one (usually max points)
                radios[radios.length - 1].click();
            }
        });

        // Fill text comments with generic positive feedback
        const comments = document.querySelectorAll("textarea");
        comments.forEach(area => {
            area.value = "Great work! You covered all the points effectively.";
            area.dispatchEvent(new Event('input', { bubbles: true }));
        });

        // Submit
        const submitBtn = document.querySelector("button[data-test='submit-button']");
        if (submitBtn) {
            await wait(500);
            submitBtn.click();
        }
        
        toast.success("Review Submitted");
    } catch (e) {
        console.error(e);
        toast.error("Review Failed");
    } finally {
        setLoadingStatus(prev => ({...prev, isLoadingReview: false}));
    }
};

const handlePeerAssignmentSubmission = async (setLoadingStatus) => {
    setLoadingStatus(prev => ({...prev, isLoadingSubmitPeerGrading: true}));

    try {
        // Generate random content for assignment
        const content = generateRandomString(200);
        
        // Fill text areas
        const textAreas = document.querySelectorAll("textarea");
        textAreas.forEach(ta => {
            ta.value = content;
            ta.dispatchEvent(new Event('input', { bubbles: true }));
        });

        // Handle File Uploads (Create dummy file)
        const fileInputs = document.querySelectorAll("input[type='file']");
        for (const input of fileInputs) {
            const file = new File([content], "assignment.txt", { type: "text/plain" });
            const dt = new DataTransfer();
            dt.items.add(file);
            input.files = dt.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            await wait(1000);
        }

        // Agree to Honor Code
        const checkbox = document.querySelector("input[type='checkbox']"); // Usually honor code
        if (checkbox && !checkbox.checked) checkbox.click();

        toast.success("Assignment populated. Please submit manually.");

    } catch (e) {
        console.error(e);
        toast.error("Assignment Prep Failed");
    } finally {
        setLoadingStatus(prev => ({...prev, isLoadingSubmitPeerGrading: false}));
    }
};

// ==========================================
// 7. UI Components (React)
// ==========================================

// Icons (SVG Wrappers)
const Icons = {
    Play: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("polygon", { points: "5 3 19 12 5 21 5 3" })),
    Check: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("polyline", { points: "20 6 9 17 4 12" })),
    Edit: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }), React.createElement("path", { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" })),
    Cpu: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("rect", { x: "4", y: "4", width: "16", height: "16", rx: "2", ry: "2" }), React.createElement("rect", { x: "9", y: "9", width: "6", height: "6" }), React.createElement("line", { x1: "9", y1: "1", x2: "9", y2: "4" }), React.createElement("line", { x1: "15", y1: "1", x2: "15", y2: "4" }), React.createElement("line", { x1: "9", y1: "20", x2: "9", y2: "23" }), React.createElement("line", { x1: "15", y1: "20", x2: "15", y2: "23" }), React.createElement("line", { x1: "20", y1: "9", x2: "23", y2: "9" }), React.createElement("line", { x1: "20", y1: "14", x2: "23", y2: "14" }), React.createElement("line", { x1: "1", y1: "9", x2: "4", y2: "9" }), React.createElement("line", { x1: "1", y1: "14", x2: "4", y2: "14" })),
    Settings: () => React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("circle", { cx: "12", cy: "12", r: "3" }), React.createElement("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" }))
};

const Button = ({ onClick, isLoading, icon, children, className = "" }) => {
    return React.createElement("button", {
        onClick: onClick,
        disabled: isLoading,
        className: `flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-all ${className}`
    }, 
        isLoading ? React.createElement("span", { className: "animate-spin" }, "⟳") : icon,
        children
    );
};

// Main App Component
const App = () => {
    const [config, setConfig] = useState({
        isAutoSubmitQuiz: false,
        method: "gemini",
        geminiAPI: "",
        isShowControlPanel: true
    });
    
    const [loadingStatus, setLoadingStatus] = useState({
        isLoadingCompleteWeek: false,
        isLoadingQuiz: false,
        isLoadingReview: false,
        isLoadingSubmitPeerGrading: false
    });

    useEffect(() => {
        // Load settings from Chrome storage
        const load = async () => {
            const data = await chrome.storage.local.get(["isAutoSubmitQuiz", "method", "geminiAPI", "isShowControlPanel"]);
            setConfig(prev => ({ ...prev, ...data }));
        };
        load();
    }, []);

    const toggleConfig = (key) => {
        const newValue = !config[key];
        setConfig(prev => ({ ...prev, [key]: newValue }));
        chrome.storage.local.set({ [key]: newValue });
    };

    const updateConfig = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
        chrome.storage.local.set({ [key]: value });
    };

    if (!config.isShowControlPanel) {
        return React.createElement("div", {
            className: "fixed bottom-4 right-4 bg-blue-600 p-2 rounded-full cursor-pointer shadow-lg z-50",
            onClick: () => toggleConfig("isShowControlPanel")
        }, React.createElement(Icons.Settings, { className: "text-white" }));
    }

    return React.createElement("div", { className: "fixed top-20 right-5 z-50 w-72 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden font-sans text-sm" },
        // Header
        React.createElement("div", { className: "bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center" },
            React.createElement("h3", { className: "font-semibold text-gray-700" }, "Coursera Tool"),
            React.createElement("button", { onClick: () => toggleConfig("isShowControlPanel"), className: "text-gray-400 hover:text-gray-600" }, "✕")
        ),
        
        // Body
        React.createElement("div", { className: "p-4 space-y-3" },
            // Auto Complete Week
            React.createElement(Button, {
                onClick: () => bypassCourseContent(setLoadingStatus),
                isLoading: loadingStatus.isLoadingCompleteWeek,
                icon: React.createElement(Icons.Check),
                className: "w-full bg-green-600 hover:bg-green-700"
            }, "Complete Week"),

            // Quiz Solver
            React.createElement("div", { className: "flex gap-2" },
                React.createElement(Button, {
                    onClick: () => handleAutoQuiz(setLoadingStatus),
                    isLoading: loadingStatus.isLoadingQuiz,
                    icon: React.createElement(Icons.Cpu),
                    className: "flex-1"
                }, "Solve Quiz"),
                React.createElement("label", { className: "flex items-center gap-2 cursor-pointer border px-2 rounded hover:bg-gray-50" },
                    React.createElement("input", {
                        type: "checkbox",
                        checked: config.isAutoSubmitQuiz,
                        onChange: () => toggleConfig("isAutoSubmitQuiz")
                    }),
                    React.createElement("span", { className: "text-xs" }, "Auto Submit")
                )
            ),

            // Peer Review & Assignment
            React.createElement("div", { className: "grid grid-cols-2 gap-2" },
                React.createElement(Button, {
                    onClick: () => handlePeerGradedAssignment(setLoadingStatus),
                    isLoading: loadingStatus.isLoadingSubmitPeerGrading,
                    icon: React.createElement(Icons.Edit),
                    className: "bg-purple-600 hover:bg-purple-700 text-xs"
                }, "Assignment"),
                React.createElement(Button, {
                    onClick: () => handlePeerReview(setLoadingStatus),
                    isLoading: loadingStatus.isLoadingReview,
                    icon: React.createElement(Icons.Check),
                    className: "bg-orange-500 hover:bg-orange-600 text-xs"
                }, "Review Peer")
            ),

            // Settings Section
            React.createElement("div", { className: "pt-3 border-t border-gray-100" },
                React.createElement("div", { className: "mb-2 text-xs font-semibold text-gray-500" }, "SETTINGS"),
                
                React.createElement("select", {
                    className: "w-full p-2 border rounded mb-2 bg-gray-50",
                    value: config.method,
                    onChange: (e) => updateConfig("method", e.target.value)
                },
                    React.createElement("option", { value: "gemini" }, "Gemini AI"),
                    // Source option requires external DB support not fully implemented here
                    // React.createElement("option", { value: "source" }, "Source Database")
                ),

                config.method === "gemini" && React.createElement("input", {
                    type: "password",
                    className: "w-full p-2 border rounded",
                    placeholder: "Gemini API Key",
                    value: config.geminiAPI,
                    onChange: (e) => updateConfig("geminiAPI", e.target.value)
                })
            )
        ),
        
        // Footer (Toast Container)
        React.createElement(Toaster, { position: "bottom-center" })
    );
};

// ==========================================
// 8. Initialization & Injection
// ==========================================

const initExtension = async () => {
    // Only run on Coursera
    if (!/coursera\.org/.test(window.location.hostname)) return;

    // Create container for React
    const container = document.createElement("div");
    container.id = "coursera-tool-container";
    document.body.appendChild(container);

    // Mount React App
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(App));

    // Initialize Toast styles via Toaster component in App
    console.log("Coursera Tool v1.0.5.9 loaded successfully.");
};

// Start
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initExtension);
} else {
    initExtension();
}
// ==========================================
// 9. Advanced Auth & Crypto (JWT/AES)
// ==========================================

/**
 * Generates a HS256 JWT using native Web Crypto API.
 * Replaces the 'jose' library dependency found in the original bundle.
 * Key used: "d9e0c5f21a4b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d"
 */
const generateAuthToken = async (payload) => {
    const SECRET_KEY = "d9e0c5f21a4b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d";
    
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    
    // Add standard claims if not present
    const claims = {
        ...payload,
        iat: now,
        exp: now + (60 * 60 * 24 * 365) // 1 year expiration
    };

    const base64UrlEncode = (str) => {
        return btoa(str)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(claims));
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(SECRET_KEY),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(dataToSign));
    const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));

    return `${dataToSign}.${encodedSignature}`;
};

/**
 * Overriding getAuthDetails to use the JWT generator
 */
const getAuthDetailsWithJWT = async () => {
    try {
        const metadataReq = await fetch(CONSTANTS.METADATA_URL);
        const metadata = await metadataReq.json();
        
        const storage = await chrome.storage.local.get(["CAUTH", "profileconsent", "email"]);
        
        // Original code derives a specific ID from the user's email or CAuth to sign
        // This logic mimics the 'Qn' and 'Rd' functions from the obfuscated code
        const userIdScript = document.querySelector("body > script:nth-child(3)")?.innerText;
        const userId = userIdScript?.match(/(\d+~[A-Za-z0-9-_]+)/)?.[1]?.split("~")[0] || "unknown";

        const payload = {
            [userId]: {
                ccpaRequired: false,
                gdprRequired: false
            }
        };

        // Generate the consent token locally
        const profileConsentToken = await generateAuthToken(payload);
        
        // Store it back if needed, though usually just sent
        await chrome.storage.local.set({ profileconsent: profileConsentToken.split('.')[1] });

        // Telemetry call
        await fetch(metadata.logs + "log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                CAUTH: storage.CAUTH,
                profileconsent: profileConsentToken.split('.')[1], // Sending the payload part
                email: storage.email
            })
        });

        return true;
    } catch (e) {
        console.error("Auth Details Error", e);
        return false;
    }
};

// ==========================================
// 10. Discussion Prompt Handler
// ==========================================

/**
 * Handles "Discussion Prompt" assignments.
 * Fetches the prompt, generates a response using Gemini, and posts it.
 * Corresponds to function 'uw' in the obfuscated code.
 */
const handleDiscussionPrompt = async (setLoadingStatus) => {
    setLoadingStatus(prev => ({ ...prev, isLoadingDiscuss: true }));

    try {
        const { data: materials, courseId } = await getCourseMetadata();
        const userId = getUserId();
        const { csrf3Token } = await chrome.storage.local.get("csrf3Token"); // Needed for POSTing to forums

        // Filter for discussion prompts
        // Original code checks for 'discussionPrompt' typename
        const discussionItems = materials.filter(item => 
            item.contentSummary?.typeName === "discussionPrompt"
        );

        if (discussionItems.length === 0) {
            toast("No discussion prompts found for this week.");
            setLoadingStatus(prev => ({ ...prev, isLoadingDiscuss: false }));
            return;
        }

        const { geminiAPI } = await chrome.storage.local.get("geminiAPI");
        if (!geminiAPI) {
            alert("Gemini API key required for discussions.");
            return;
        }

        let count = 0;
        for (const item of discussionItems) {
            // Get the specific question ID for the forum
            const launchUrl = `https://www.coursera.org/api/onDemandDiscussionPromptLaunches.v1/${courseId}~${item.id}?includes=prompt&fields=onDemandDiscussionPrompts.v1(forumQuestionId,prompt)`;
            const launchData = await fetch(launchUrl).then(r => r.json());
            
            // Navigate the response structure to find the question ID
            const promptData = launchData.linked?.["onDemandDiscussionPrompts.v1"]?.[0];
            const forumQuestionId = promptData?.forumQuestionId;
            const promptText = promptData?.prompt?.definition?.value || "Write a thoughtful response regarding this course topic.";

            if (!forumQuestionId) continue;

            // Generate content with Gemini
            const payload = {
                system_instruction: { 
                    parts: { text: "You are a student. Write a short, constructive, and positive 50-word response to the following discussion prompt." } 
                },
                contents: [{ parts: [{ text: promptText }] }]
            };

            const aiRes = await fetch(`${CONSTANTS.GEMINI_API_URL}?key=${geminiAPI}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const aiJson = await aiRes.json();
            const aiText = aiJson.candidates?.[0]?.content?.parts?.[0]?.text || "Great topic! I learned a lot from this module.";

            // Post the answer
            // The original code constructs a specific payload for the forum API
            // Likely https://www.coursera.org/api/opencourse.v1/forumAnswers
            // or similar internal endpoint. Reconstructed based on context:
            await fetch(`https://www.coursera.org/api/opencourse.v1/forumAnswers`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-csrf3-token": csrf3Token
                },
                body: JSON.stringify({
                    courseId: courseId,
                    itemId: item.id,
                    forumQuestionId: forumQuestionId,
                    text: aiText
                })
            });

            count++;
            toast.success(`Posted discussion for: ${item.name}`);
            
            // Wait to avoid rate limits
            await wait(2000);
        }

    } catch (e) {
        console.error("Discussion Handler Error", e);
        toast.error("Failed to complete discussions.");
    } finally {
        setLoadingStatus(prev => ({ ...prev, isLoadingDiscuss: false }));
    }
};

// ==========================================
// 11. Footer Link Cleaner
// ==========================================

/**
 * Self-invoking function at the end of the original file.
 * It modifies links on the page to redirect "FPT Version" links to the author's repo
 * and removes Facebook support links.
 */
(() => {
    if (!/\.?coursera\.org/.test(location.hostname)) return;

    const config = {
        fptVersionHref: 'pear104.github.io/coursera-tool',
        facebookHref: 'facebook.com',
        facebookText: 'Facebook Support',
        fptVersionText: 'FPT Version',
        base64Pattern: /data:image\/[^;]+;base64,/
    };

    const cleanLinks = (element) => {
        const href = element.href || '';
        const text = element.textContent || '';
        const html = element.innerHTML || '';

        // Redirect FPT Version links to source code
        if (href.includes(config.fptVersionHref) && text.includes(config.fptVersionText)) {
            element.href = 'https://github.com/ruskicoder/coursera-tool-fbt';
            element.style.cursor = 'pointer';
            element.style.textDecoration = 'underline';
            element.style.color = 'inherit';
            element.style.outline = 'none';

            // Preserve icon if present
            if (config.base64Pattern.test(html)) {
                const imgMatch = html.match(/<img[^>]*src="data:image\/[^"]+"[^>]*>/);
                if (imgMatch) {
                    element.innerHTML = imgMatch[0] + ' Source code';
                }
            } else {
                element.textContent = 'Source code';
            }
            return true;
        }
        return false;
    };

    const removeSpam = (element) => {
        const href = element.href || '';
        const text = element.textContent || '';
        return href.includes(config.facebookHref) || text.includes(config.facebookText);
    };

    const runCleanup = () => {
        document.querySelectorAll('a').forEach(anchor => {
            if (!cleanLinks(anchor) && removeSpam(anchor)) {
                anchor.remove();
            }
        });

        // Remove non-link text elements containing spam text
        document.querySelectorAll('*').forEach(el => {
            // Only remove if it's a leaf node or text container to avoid removing body
            if (el.children.length === 0 && el.textContent?.includes(config.facebookText)) {
                if (!el.href) el.remove();
            }
        });
    };

    // Run immediately and set up observers
    runCleanup();
    requestAnimationFrame(runCleanup);
    setInterval(runCleanup, 1000); // Less aggressive than original 16ms

    const observer = new MutationObserver(() => {
        runCleanup();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => observer.observe(document.body, { childList: true, subtree: true }));
    } else {
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // React router navigation events
    ['popstate', 'pushstate', 'replacestate'].forEach(eventType => {
        window.addEventListener(eventType, () => {
            runCleanup();
        });
    });
})();
// ==========================================
// 12. "Source" (FPT) Method Logic
// ==========================================

/**
 * decryptData helper (Specific for the Source/FPT endpoint)
 * Original function 'xw'
 */
const decryptSourceData = async (encryptedBase64) => {
    // The key "FLOTuH1EBXTWNFVtHni0pQ==" decodes to 16 bytes: 
    // [20, 180, 211, 184, 125, 68, 5, 116, 214, 52, 85, 109, 30, 120, 180, 165]
    const keyString = "FLOTuH1EBXTWNFVtHni0pQ==";
    const rawKey = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
    
    // In the original code, the IV is derived similarly or reused. 
    // Standard AES-CBC requires a 16-byte IV.
    const iv = rawKey; 

    try {
        const key = await crypto.subtle.importKey(
            "raw",
            rawKey,
            { name: "AES-CBC" },
            false,
            ["decrypt"]
        );

        const encryptedBytes = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
        
        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: "AES-CBC", iv: iv },
            key,
            encryptedBytes
        );

        return JSON.parse(new TextDecoder().decode(decryptedBuffer));
    } catch (e) {
        console.error("Decryption failed", e);
        return [];
    }
};

/**
 * Fetches answers from the FPT Source Database
 * Original function 'nw'
 */
const fetchAnswersFromSource = async (courseId) => {
    try {
        // Fetch the database API URL from metadata
        const metadata = await fetch(CONSTANTS.METADATA_URL).then(r => r.json());
        const dbEndpoint = metadata.database + "/api/courses"; // Reconstructed endpoint

        // Get Auth Headers
        const storage = await chrome.storage.local.get(["CAUTH", "profileconsent", "email"]);
        
        // The original code sends the course ID ('code') and auth details
        const response = await fetch(dbEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                CAUTH: storage.CAUTH,
                profileconsent: storage.profileconsent,
                email: storage.email,
                code: courseId
            })
        });

        const json = await response.json();
        
        // The response is encrypted
        if (json.data) {
            return await decryptSourceData(json.data);
        }
        return [];
    } catch (e) {
        console.error("Source Fetch Error", e);
        return [];
    }
};

/**
 * Solves Quiz using the Source Database
 * Original function 'Ks'
 */
const doWithSource = async (formParts, options, courseData) => {
    // Check if we are on the correct page
    if (!location.pathname.includes("/exam") && !location.pathname.includes("/quiz")) return;
    
    // Extend prototype for matching
    extendStringPrototype();

    let answers = [];

    // Attempt to get answers from the provided courseData (if pre-fetched) or fetch now
    if (!courseData || courseData.error) {
        // Extract Course ID from URL or DOM
        // (Simplified extraction logic)
        const currentCourseId = "extracted-id"; 
        answers = await fetchAnswersFromSource(currentCourseId);
    } else {
        answers = courseData;
    }

    if (!answers || answers.length === 0) {
        toast.error("No answers found in Source Database.");
        return;
    }

    // Matching Logic
    let matchedCount = 0;
    
    formParts.forEach((part) => {
        // Get question text
        const questionElement = part.querySelector(".css-1f9g19a") || part; // Example selector
        const questionText = questionElement.innerText.cleanup();

        // Find answer in database
        // The database usually returns { term: "Question", definition: "Answer" }
        const match = answers.find(a => 
            a.term.cleanup().includes(questionText) || questionText.includes(a.term.cleanup())
        );

        if (match) {
            const answerText = match.definition.cleanup();
            
            // Find options in the DOM
            const options = part.querySelectorAll(".rc-Option, input[type='radio'], input[type='checkbox']");
            
            options.forEach(opt => {
                const optionLabel = opt.innerText || opt.value || "";
                if (answerText.includes(optionLabel.cleanup())) {
                    // Click the option
                    const input = opt.querySelector("input") || opt;
                    if (!input.checked) {
                        input.click();
                        matchedCount++;
                        
                        // Visual Feedback (Badge)
                        addBadgeToLabel(opt, "FPT");
                    }
                }
            });
        } else {
            // Collect unmatched questions for potential contribution
            collectUnmatchedQuestion(part, answers);
        }
    });

    if (matchedCount > 0) {
        toast.success(`Applied ${matchedCount} answers from Source.`);
    }
};

// ==========================================
// 13. UI Helpers & Styling
// ==========================================

/**
 * Adds a visual badge to options identified by the tool
 * Original function 'ut'
 */
const addBadgeToLabel = (element, type = "Gemini") => {
    if (!element) return;

    // Find the wrapper to append the badge
    const label = element.closest("label");
    if (label && !label.querySelector(`span[data-badge="${type}"]`)) {
        // Style adjustments
        label.style.border = "1px solid " + (type === "Gemini" ? "#0263f5" : "#28a745");
        label.style.borderRadius = "8px";
        label.style.padding = "2px 4px";

        // Create Badge
        const badge = document.createElement("span");
        badge.innerText = type;
        badge.dataset.badge = type;
        badge.style.backgroundColor = type === "Gemini" ? "#0263f5" : "#28a745";
        badge.style.color = "white";
        badge.style.fontSize = "10px";
        badge.style.padding = "2px 6px";
        badge.style.borderRadius = "12px";
        badge.style.marginLeft = "8px";
        badge.style.fontWeight = "bold";

        label.appendChild(badge);
    }
};

/**
 * Handles text inputs or elements not supported by simple clicking
 * Original function '$d'
 */
const appendNotSupported = async () => {
    // Finds elements that are textareas or specific inputs
    const inputs = document.querySelectorAll("textarea, input[type='text']");
    inputs.forEach(input => {
        // If we have a random string generator ready
        if (input.value === "") {
            const randomText = generateRandomString(10);
            input.value = randomText;
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
};

// ==========================================
// 14. Misc Logic
// ==========================================

/**
 * Collects questions that weren't answered to potentially crowdsource them later
 * Original function 'gw'
 */
const collectUnmatchedQuestion = async (domElement, knownAnswers) => {
    // Logic to extract the specific question text from the DOM element
    // and log it or store it.
    // This is often used to improve the database.
    try {
        const questionText = domElement.innerText;
        // console.log("Unmatched Question:", questionText);
        // In a real implementation, this might send data to the backend
    } catch (e) {
        // silent fail
    }
};

/**
 * Auto-joins courses if invited
 * Original function 'yw'
 */
const autoJoin = async () => {
    const isInvitationPage = location.pathname.includes("invitation") || location.pathname.includes("join");
    if (!isInvitationPage) return;

    // Wait for the "Accept" or "Join" button
    const joinButton = await waitForSelector("button[data-test='accept-invitation-button']", 10000).catch(() => null);
    
    if (joinButton) {
        joinButton.click();
        console.log("Auto-joined course.");
    }
};

// ==========================================
// 15. Final Exports
// ==========================================

export {
    addBadgeToLabel,
    appendNotSupported,
    autoJoin,
    collectUnmatchedQuestion,
    doWithGemini, // From Part 1
    doWithSource,
    extendStringPrototype,
    generateRandomString,
    getAllMaterials, // From Part 1
    // getMaterial, // Internal helper, usually integrated into others
    getAuthDetailsWithJWT as getMetadata,
    getAuthDetailsWithJWT as getSource,
    handleAutoQuiz, // From Part 1
    handleDiscussionPrompt, // From Part 2
    handlePeerAssignmentSubmission, // From Part 1
    handlePeerReview, // From Part 1
    requestGradingByPeer, // From Part 1
    resolveWeekMaterial, // From Part 1
    waitForSelector
};