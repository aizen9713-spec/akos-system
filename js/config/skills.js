// Presentation metadata only: keys match state.skills.
const SKILL_ICONS = Object.freeze({
 automotive:'🔧', automotiveElectrical:'⚡', diagnostics:'🔍', automotiveAC:'❄️',
 welding:'🔥', buildingDIY:'🔨', appDevelopment:'💻', investing:'📈',
 entrepreneurship:'💼', communication:'💬', english:'🌐', firstAid:'🩹'
});
function skillIcon(key) { return Object.hasOwn(SKILL_ICONS, key) ? SKILL_ICONS[key] : '◇'; }
