// Reihenfolge im Radar (Start 12 Uhr, im Uhrzeigersinn):
// logisch -> räumlich -> körper -> musikalisch -> interpersonal -> sprachlich -> intrapersonal -> existenziell -> naturbezogen
const INTELLIGENCES = [
  { key: "logisch",    label: "Logisch-mathematisch",        icon: "assets/icons/logisch.png" },
  { key: "raeumlich",  label: "Räumlich-visuell",            icon: "assets/icons/raeumlich.png" },
  { key: "koerper",    label: "Körperlich-kinästhetisch",    icon: "assets/icons/koerper.png" },
  { key: "musikalisch",label: "Musikalisch",                 icon: "assets/icons/musikalisch.png" },
  { key: "inter",      label: "Interpersonal",               icon: "assets/icons/inter.png" },
  { key: "sprachlich", label: "Sprachlich",                  icon: "assets/icons/sprachlich.png" },
  { key: "intra",      label: "Intrapersonal",               icon: "assets/icons/intra.png" },
  { key: "exist",      label: "Existenziell",                icon: "assets/icons/exist.png" },
  { key: "natur",      label: "Naturbezogen",                icon: "assets/icons/natur.png" },
];

// Aussagen (6 pro Bereich als Start; du kannst jederzeit erweitern)
const QUESTIONS = [
  // logisch
  { id:"l1", intel:"logisch", text:"Ich rechne gerne (plus, minus, mal, geteilt)." },
  { id:"l2", intel:"logisch", text:"Ich mag Sachaufgaben und Knobelrätsel." },
  { id:"l3", intel:"logisch", text:"Logikspiele (Sudoku, Logicals) machen mir Spass." },
  { id:"l4", intel:"logisch", text:"Ich arbeite gern mit geometrischen Formen." },
  { id:"l5", intel:"logisch", text:"Ich würde gern 3D-Druck und CAD ausprobieren." },
  { id:"l6", intel:"logisch", text:"Ich finde Muster in Zahlen spannend." },

  // räumlich
  { id:"r1", intel:"raeumlich", text:"Ich zeichne oder gestalte gern." },
  { id:"r2", intel:"raeumlich", text:"Ich baue gern mit LEGO oder Bauklötzen." },
  { id:"r3", intel:"raeumlich", text:"Ich mag Karten, Pläne oder Baupläne." },
  { id:"r4", intel:"raeumlich", text:"Ich stelle mir Dinge gut im Kopf vor." },
  { id:"r5", intel:"raeumlich", text:"Ich würde gern Trickfilm/Legetrick machen." },
  { id:"r6", intel:"raeumlich", text:"Ich mag es, Dinge zu entwerfen." },

  // körper
  { id:"k1", intel:"koerper", text:"Ich baue und bastle gern." },
  { id:"k2", intel:"koerper", text:"Ich arbeite gern mit Werkzeug." },
  { id:"k3", intel:"koerper", text:"Ich bewege mich gern." },
  { id:"k4", intel:"koerper", text:"Ich lerne besser, wenn ich etwas ausprobieren darf." },
  { id:"k5", intel:"koerper", text:"Ich mag Making-Projekte." },
  { id:"k6", intel:"koerper", text:"Ich bin gern handwerklich tätig." },

  // musikalisch
  { id:"m1", intel:"musikalisch", text:"Ich höre gerne Musik." },
  { id:"m2", intel:"musikalisch", text:"Ich singe gerne." },
  { id:"m3", intel:"musikalisch", text:"Ich merke mir Dinge gut mit Liedern." },
  { id:"m4", intel:"musikalisch", text:"Ich mache gern Beats oder Rhythmus." },
  { id:"m5", intel:"musikalisch", text:"Ich würde gern Hörspiele aufnehmen." },
  { id:"m6", intel:"musikalisch", text:"Ich höre genau hin, wenn etwas klingt." },

  // interpersonal
  { id:"i1", intel:"inter", text:"Ich helfe gern anderen." },
  { id:"i2", intel:"inter", text:"Ich mag Gruppenarbeit." },
  { id:"i3", intel:"inter", text:"Ich erkläre anderen gern etwas." },
  { id:"i4", intel:"inter", text:"Ich diskutiere gern." },
  { id:"i5", intel:"inter", text:"Ich mag Teamprojekte." },
  { id:"i6", intel:"inter", text:"Ich kann gut zuhören." },

  // sprachlich
  { id:"s1", intel:"sprachlich", text:"Ich lese gerne Bücher oder Comics." },
  { id:"s2", intel:"sprachlich", text:"Ich schreibe gerne Geschichten oder Tagebuch." },
  { id:"s3", intel:"sprachlich", text:"Ich erfinde gerne eigene Geschichten." },
  { id:"s4", intel:"sprachlich", text:"Ich spiele gern Theater oder Rollenspiele." },
  { id:"s5", intel:"sprachlich", text:"Ich erkläre anderen gern etwas." },
  { id:"s6", intel:"sprachlich", text:"Ich spiele gern mit Wörtern." },

  // intrapersonal
  { id:"p1", intel:"intra", text:"Ich weiss gut, was ich mag." },
  { id:"p2", intel:"intra", text:"Ich denke über schwierige Fragen nach." },
  { id:"p3", intel:"intra", text:"Ich arbeite gern allein." },
  { id:"p4", intel:"intra", text:"Ich mag ruhige Aufgaben." },
  { id:"p5", intel:"intra", text:"Ich reflektiere über mich." },
  { id:"p6", intel:"intra", text:"Ich setze mir Ziele." },

  // existenziell
  { id:"e1", intel:"exist", text:"Ich interessiere mich für Geschichte." },
  { id:"e2", intel:"exist", text:"Ich mag Archäologie-Projekte." },
  { id:"e3", intel:"exist", text:"Ich denke über Gerechtigkeit nach." },
  { id:"e4", intel:"exist", text:"Ich frage oft nach dem «Warum»." },
  { id:"e5", intel:"exist", text:"Ich finde alte Kulturen spannend." },
  { id:"e6", intel:"exist", text:"Ich finde grosse Fragen spannend." },

  // naturbezogen
  { id:"n1", intel:"natur", text:"Ich bin gern draussen in der Natur." },
  { id:"n2", intel:"natur", text:"Ich interessiere mich für Tiere." },
  { id:"n3", intel:"natur", text:"Ich mag Experimente." },
  { id:"n4", intel:"natur", text:"Ich würde gern mikroskopieren." },
  { id:"n5", intel:"natur", text:"Ich finde Fossilien und Evolution spannend." },
  { id:"n6", intel:"natur", text:"Ich mag Wasser- oder Waldforschung." },
];

// Projekte: intels = beteiligte Intelligenzen (mind. 3)
const PROJECTS = [
  { id:"pr_robotik", name:"Roboter bauen & programmieren", tags:["Scratch/MakeCode/LEGO Spike/Arduino"], intels:["logisch","raeumlich","koerper","inter"] },
  { id:"pr_ki", name:"KI-Labor (Modelle trainieren & einbauen)", tags:["Teachable Machine/PictoBlox"], intels:["logisch","sprachlich","raeumlich","intra"] },
  { id:"pr_making", name:"Making-Werkstatt (löten & Schaltungen)", tags:["Elektronik/Repair"], intels:["koerper","logisch","raeumlich"] },
  { id:"pr_plants", name:"Physical Computing: Pflanzenbox", tags:["Sensoren/Automatisierung"], intels:["logisch","natur","koerper"] },
  { id:"pr_3d", name:"3D-Design & 3D-Druck", tags:["CAD/Druck"], intels:["raeumlich","logisch","koerper"] },
  { id:"pr_stopmotion", name:"Trickfilm & Legetrick", tags:["Stop-Motion"], intels:["raeumlich","sprachlich","musikalisch"] },
  { id:"pr_media", name:"Erklärvideo & Hörspiel-Studio", tags:["Filmen/Schneiden/Vertonen"], intels:["sprachlich","musikalisch","inter"] },
  { id:"pr_funk", name:"Funk & Morse (Codes senden)", tags:["NATO-Alphabet/Morsen"], intels:["logisch","sprachlich","musikalisch"] },
  { id:"pr_physik", name:"Forscherlabor Physik", tags:["Licht/Strom/Magnet/Schall"], intels:["logisch","natur","raeumlich"] },
  { id:"pr_astro", name:"Astronomie & Zeit", tags:["Sterne/Sonnenuhr"], intels:["natur","logisch","exist"] },
  { id:"pr_bio", name:"Mikroskop & Biolab", tags:["Wasser/Pflanzen/Pilze"], intels:["natur","logisch","raeumlich"] },
  { id:"pr_fossil", name:"Fossilien & Evolution", tags:["Urzeit/Modelle"], intels:["natur","exist","raeumlich"] },
  { id:"pr_chem", name:"Chemie-Experimentierküche", tags:["Reaktionen/Kristalle"], intels:["logisch","natur","koerper"] },
];
