const resume = require("./resume.actions");
const github = require("./github.actions");
const roadmap = require("./roadmap.actions");
const interview = require("./interview.actions");
const portfolio = require("./portfolio.actions");
const dsa = require("./dsa.actions");

const ACTION_CATALOG = [
  ...resume,
  ...github,
  ...roadmap,
  ...interview,
  ...portfolio,
  ...dsa
];

module.exports = { ACTION_CATALOG };
