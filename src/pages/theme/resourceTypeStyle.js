// utility to determine contrast color
function getContrastYIQ(hexColor) {
    // normalize shorthand hex (#abc -> #aabbcc)
    let hex = hexColor.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex.split('').map(x => x + x).join('');
    }
    const r = parseInt(hex.substr(0,2),16);
    const g = parseInt(hex.substr(2,2),16);
    const b = parseInt(hex.substr(4,2),16);
    const yiq = (r*299 + g*587 + b*114) / 1000;
    return yiq >= 128 ? '#222' : '#fff';
}
const resourceTypeStyle = {
    logic_container: {
        fill: "#fff",
        stroke: "#54457F",
        strokeWidth: 1,
        radius: 10,
        dashed: true
    },
    environment_resource: {
        fill: "#b467e0ff",
        stroke: "#fff",
        strokeWidth: 1,
        radius: 7
    },
    protected_resource: {
        fill: "#e25762",
        stroke: "#fff",
        strokeWidth: 2,
        radius: 7
    },
    pipeline: {
        fill: "#5669b3",
        stroke: "#fff",
        strokeWidth: 1,
        radius: 7
    },
    build: {
        fill: "#ffa64d",
        stroke: "#fff",
        strokeWidth: 1,
        radius: 6
    },
    artifact_feed: {
        fill: "#00bcd4",
        stroke: "#fff",
        strokeWidth: 1,
        radius: 6
    },
    committer: {
        fill: "#ffd600",
        stroke: "#fff",
        strokeWidth: 1,
        radius: 5
    },
    historic_build: {
        fill: "#ffa64d",
        stroke: "#fff",
        strokeWidth: 1,
        radius: 6
    },
    potential_build: {
        fill: "#cccc00",
        stroke: "#FFFF00",
        strokeWidth: 1,
        radius: 5
    },
    queue: {
        fill: "#534D41",
        stroke: "#fff",
        strokeWidth: 1,
        radius: 4
    },
    project: {
        fill: "#b76ad1",
        stroke: "#fff",
        strokeWidth: 1,
        strokeColor: "#fff",
        radius: 7
    },
    stage: {
        fill: "#ff9eff",
        stroke: "#fff",
        strokeWidth: 1,
        radius: 5
    },
    job: {
        fill: "#9e9eff",
        stroke: "#fff",
        strokeWidth: 1,
        radius: 4
    },
    step: {
        fill: "#5252ff",
        stroke: "#fff",
        strokeWidth: 1,
        radius: 3
    },
    repo: {
        fill: "#d0e3d9",
        stroke: "#fff",
        strokeWidth: 1,
        radius: 5
    },
    languages: {
        HCL: {
            fill: "#9d6ad1",
            stroke: "#fff",
            fontColor: getContrastYIQ("#9d6ad1")
        },
        PowerShell: {
            fill: "#add8e6",
            stroke: "#fff",
            fontColor: getContrastYIQ("#add8e6")
        },
        Python: {
            fill: "#3776AB", // official Python blue
            stroke: "#fff",
            fontColor: getContrastYIQ("#3776AB")
        },
        Java: {
            fill: "#DB2B39",
            stroke: "#fff",
            fontColor: getContrastYIQ("#DB2B39")
        },
        Ansible: {
            fill: "#000000",
            stroke: "#fff",
            fontColor: getContrastYIQ("#000000")
        },
        JavaScript: {
            fill: "#ff7f0e",
            stroke: "#fff",
            fontColor: getContrastYIQ("#ff7f0e")
        },
        CSS: {
            fill: "#ff69b4",
            stroke: "#fff",
            fontColor: getContrastYIQ("#ff69b4")
        },
        HTML: {
            fill: "#aa11b4",
            stroke: "#fff",
            fontColor: getContrastYIQ("#aa11b4")
        },
        YAML: {
            fill: "#ff69b4",
            stroke: "#fff",
            fontColor: getContrastYIQ("#ff69b4")
        },
        JSON: {
            fill: "#00bcd4", // nicer cyan
            stroke: "#fff",
            fontColor: getContrastYIQ("#00bcd4")
        },
        TypeScript: {
            fill: "#3178c6", // TS brand blue
            stroke: "#fff",
            fontColor: getContrastYIQ("#3178c6")
        },
        ".jsonc": {
            fill: "#00bcd4",
            stroke: "#fff",
            fontColor: getContrastYIQ("#00bcd4")
        },
        "C#": {
            fill: "#ffd600", // softer yellow
            stroke: "#fff",
            fontColor: getContrastYIQ("#ffd600")
        },
        SCSS: {
            fill: "#c6538c", // sass pink
            stroke: "#fff",
            fontColor: getContrastYIQ("#c6538c")
        },
        ".bicep": {
            fill: "#0061a8",
            stroke: "#fff",
            fontColor: getContrastYIQ("#0061a8")
        },
        ".otf": {
            fill: "#f5f5f5", // off-white
            stroke: "#ccc",
            fontColor: getContrastYIQ("#f5f5f5")
        },
        ".razor": {
            fill: "#107c41", // strong green
            stroke: "#fff",
            fontColor: getContrastYIQ("#107c41")
        },
        ".eot": {
            fill: "#f5f5f5",
            stroke: "#ccc",
            fontColor: getContrastYIQ("#f5f5f5")
        },
        ".md": {
            fill: "#333",
            stroke: "#fff",
            fontColor: getContrastYIQ("#333")
        },
        Pug: {
            fill: "#444",
            stroke: "#fff",
            fontColor: getContrastYIQ("#444")
        },
        ".p7s": {
            fill: "#1e88e5",
            stroke: "#fff",
            fontColor: getContrastYIQ("#1e88e5")
        },
        ".dcproj": {
            fill: "#fb8c00",
            stroke: "#fff",
            fontColor: getContrastYIQ("#fb8c00")
        },
        ".dockerignore": {
            fill: "#8bc34a",
            stroke: "#fff",
            fontColor: getContrastYIQ("#8bc34a")
        }
    }
};

export default resourceTypeStyle;