// MLB WebCast Live Module
// Schedule + game info from ESPN API, streams from mlbwebcast.com

async function soraFetch(url, options) {
    options = options || {};
    try {
        if (typeof fetchv2 !== "undefined") {
            return await fetchv2(url, options.headers || {}, options.method || "GET", options.body || null, true, "utf-8");
        }
        return await fetch(url, options);
    } catch (e) {
        try { return await fetch(url, options); } catch (e2) { return null; }
    }
}

async function getText(res) {
    if (!res) return "";
    try {
        if (typeof res.text === "function") return await res.text();
        return String(res);
    } catch (e) { return ""; }
}

async function getJson(res) {
    if (!res) return null;
    try {
        if (typeof res.json === "function") return await res.json();
        var t = typeof res.text === "function" ? await res.text() : String(res);
        return JSON.parse(t);
    } catch (e) { return null; }
}

var UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
var ICON = "https://raw.githubusercontent.com/JayGxnzalez/MLB-Webcast/main/MLBWC.png";
var ESPN_API = "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard";

// Map ESPN team abbreviations to mlbwebcast.com slugs
var ESPN_TO_SLUG = {
    "ARI": "arizona-diamondbacks-live", "ATL": "atlanta-braves-live",
    "BAL": "baltimore-orioles-live", "BOS": "boston-red-sox-live",
    "CHC": "chicago-cubs-live", "CWS": "chicago-white-sox-live",
    "CIN": "cincinnati-reds-live", "CLE": "cleveland-guardians-live",
    "COL": "colorado-rockies-live", "DET": "detroit-tigers-live",
    "HOU": "houston-astros-live", "KC": "kansas-city-royals-live",
    "LAA": "los-angeles-angels-live", "LAD": "los-angeles-dodgers-live",
    "MIA": "miami-marlins-live", "MIL": "milwaukee-brewers-live",
    "MIN": "minnesota-twins-live", "NYM": "new-york-mets-live",
    "NYY": "new-york-yankees-live", "OAK": "oakland-athletics-live",
    "PHI": "philadelphia-phillies-live", "PIT": "pittsburgh-pirates-live",
    "SD": "san-diego-padres-live", "SF": "san-francisco-giants-live",
    "SEA": "seattle-mariners-live", "STL": "st-louis-cardinals-live",
    "TB": "tampa-bay-rays-live", "TEX": "texas-rangers-live",
    "TOR": "toronto-blue-jays-live", "WSH": "washington-nationals-live"
};

var TEAMS = [
    { name: "Arizona Diamondbacks", slug: "arizona-diamondbacks-live", abbr: "ARI" },
    { name: "Atlanta Braves", slug: "atlanta-braves-live", abbr: "ATL" },
    { name: "Baltimore Orioles", slug: "baltimore-orioles-live", abbr: "BAL" },
    { name: "Boston Red Sox", slug: "boston-red-sox-live", abbr: "BOS" },
    { name: "Chicago Cubs", slug: "chicago-cubs-live", abbr: "CHC" },
    { name: "Chicago White Sox", slug: "chicago-white-sox-live", abbr: "CWS" },
    { name: "Cincinnati Reds", slug: "cincinnati-reds-live", abbr: "CIN" },
    { name: "Cleveland Guardians", slug: "cleveland-guardians-live", abbr: "CLE" },
    { name: "Colorado Rockies", slug: "colorado-rockies-live", abbr: "COL" },
    { name: "Detroit Tigers", slug: "detroit-tigers-live", abbr: "DET" },
    { name: "Houston Astros", slug: "houston-astros-live", abbr: "HOU" },
    { name: "Kansas City Royals", slug: "kansas-city-royals-live", abbr: "KC" },
    { name: "Los Angeles Angels", slug: "los-angeles-angels-live", abbr: "LAA" },
    { name: "Los Angeles Dodgers", slug: "los-angeles-dodgers-live", abbr: "LAD" },
    { name: "Miami Marlins", slug: "miami-marlins-live", abbr: "MIA" },
    { name: "Milwaukee Brewers", slug: "milwaukee-brewers-live", abbr: "MIL" },
    { name: "Minnesota Twins", slug: "minnesota-twins-live", abbr: "MIN" },
    { name: "New York Mets", slug: "new-york-mets-live", abbr: "NYM" },
    { name: "New York Yankees", slug: "new-york-yankees-live", abbr: "NYY" },
    { name: "Oakland Athletics", slug: "oakland-athletics-live", abbr: "OAK" },
    { name: "Philadelphia Phillies", slug: "philadelphia-phillies-live", abbr: "PHI" },
    { name: "Pittsburgh Pirates", slug: "pittsburgh-pirates-live", abbr: "PIT" },
    { name: "San Diego Padres", slug: "san-diego-padres-live", abbr: "SD" },
    { name: "San Francisco Giants", slug: "san-francisco-giants-live", abbr: "SF" },
    { name: "Seattle Mariners", slug: "seattle-mariners-live", abbr: "SEA" },
    { name: "St. Louis Cardinals", slug: "st-louis-cardinals-live", abbr: "STL" },
    { name: "Tampa Bay Rays", slug: "tampa-bay-rays-live", abbr: "TB" },
    { name: "Texas Rangers", slug: "texas-rangers-live", abbr: "TEX" },
    { name: "Toronto Blue Jays", slug: "toronto-blue-jays-live", abbr: "TOR" },
    { name: "Washington Nationals", slug: "washington-nationals-live", abbr: "WSH" },
    { name: "MLB Network", slug: "mlb-network-live", abbr: "" },
    { name: "Fox Sports", slug: "fox-sports-live", abbr: "" }
];

function teamLogo(abbr) {
    if (!abbr) return ICON;
    return "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/" + abbr.toLowerCase() + ".png";
}

function formatGameTime(dateStr) {
    try {
        var d = new Date(dateStr);
        var h = d.getUTCHours();
        var m = d.getUTCMinutes();
        var ampm = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        return h + ":" + (m < 10 ? "0" + m : m) + " " + ampm + " ET";
    } catch (e) { return ""; }
}

function buildGameInfo(comp) {
    try {
        var away = null, home = null;
        for (var i = 0; i < comp.competitors.length; i++) {
            if (comp.competitors[i].homeAway === "away") away = comp.competitors[i];
            if (comp.competitors[i].homeAway === "home") home = comp.competitors[i];
        }
        if (!away || !home) return null;

        var status = comp.status.type;
        var statusStr = "";
        if (status.state === "in") statusStr = status.detail;
        else if (status.state === "pre") statusStr = formatGameTime(comp.date);
        else statusStr = "Final";

        var awayRecord = "";
        var homeRecord = "";
        for (var r = 0; r < (away.records || []).length; r++) {
            if (away.records[r].type === "total") awayRecord = away.records[r].summary;
        }
        for (var r = 0; r < (home.records || []).length; r++) {
            if (home.records[r].type === "total") homeRecord = home.records[r].summary;
        }

        var awayAbbr = away.team.abbreviation;
        var homeAbbr = home.team.abbreviation;
        var awaySlug = ESPN_TO_SLUG[awayAbbr] || "";
        var homeSlug = ESPN_TO_SLUG[homeAbbr] || "";

        // Build description
        var parts = [];
        parts.push(status.state === "in" ? "\uD83D\uDD34 LIVE \u2014 " + statusStr : "\u23F0 " + statusStr);
        parts.push("\uD83C\uDFDF " + comp.venue.fullName + ", " + comp.venue.address.city);
        parts.push(away.team.displayName + " (" + awayRecord + ") @ " + home.team.displayName + " (" + homeRecord + ")");

        // Starters
        var awayStarter = "", homeStarter = "";
        for (var p = 0; p < (away.probables || []).length; p++) {
            awayStarter = away.probables[p].athlete.shortName + " " + (away.probables[p].record || "");
        }
        for (var p = 0; p < (home.probables || []).length; p++) {
            homeStarter = home.probables[p].athlete.shortName + " " + (home.probables[p].record || "");
        }
        if (awayStarter || homeStarter) {
            parts.push("\u26BE SP: " + (awayStarter || "TBD") + " vs " + (homeStarter || "TBD"));
        }

        // Broadcast
        if (comp.broadcast) parts.push("\uD83D\uDCFA " + comp.broadcast);

        return {
            title: away.team.shortDisplayName + " @ " + home.team.shortDisplayName,
            image: teamLogo(homeAbbr),
            awayLogo: teamLogo(awayAbbr),
            homeLogo: teamLogo(homeAbbr),
            description: parts.join("\n"),
            statusState: status.state,
            statusStr: statusStr,
            awayScore: away.score,
            homeScore: home.score,
            awaySlug: awaySlug,
            homeSlug: homeSlug,
            homeAbbr: homeAbbr,
            awayAbbr: awayAbbr
        };
    } catch (e) { return null; }
}

// Cache ESPN data per session
var espnCache = null;

async function fetchESPN() {
    if (espnCache) return espnCache;
    try {
        var res = await soraFetch(ESPN_API);
        var data = await getJson(res);
        if (data && data.events) {
            espnCache = data.events;
            return espnCache;
        }
    } catch (e) {}
    return [];
}

async function searchResults(keyword) {
    var results = [];
    var kw = keyword.toLowerCase().trim();

    if (kw === "" || kw === "all" || kw === "mlb") {
        var events = await fetchESPN();
        for (var i = 0; i < events.length; i++) {
            var comp = events[i].competitions[0];
            var info = buildGameInfo(comp);
            if (!info) continue;
            var homeSlug = info.homeSlug || "";
            var watchUrl = homeSlug ? "https://mlbwebcast.com/" + homeSlug + "/" : "";
            if (!watchUrl) continue;
            var statusLabel = info.statusState === "in" ? "\uD83D\uDD34 " : "\u23F0 ";
            results.push({
                title: statusLabel + info.title + " \u2014 " + info.statusStr,
                image: info.image,
                href: watchUrl
            });
        }
        if (results.length === 0) {
            for (var i = 0; i < TEAMS.length; i++) {
                results.push({
                    title: TEAMS[i].name,
                    image: teamLogo(TEAMS[i].abbr),
                    href: "https://mlbwebcast.com/" + TEAMS[i].slug + "/"
                });
            }
        }
        return JSON.stringify(results);
    }

    for (var i = 0; i < TEAMS.length; i++) {
        if (TEAMS[i].name.toLowerCase().indexOf(kw) !== -1) {
            results.push({
                title: TEAMS[i].name,
                image: teamLogo(TEAMS[i].abbr),
                href: "https://mlbwebcast.com/" + TEAMS[i].slug + "/"
            });
        }
    }
    return JSON.stringify(results);
}

async function extractDetails(url) {
    try {
        // Extract slug from URL
        var slugMatch = url.match(/mlbwebcast\.com\/([^\/]+)\/?$/);
        var slug = slugMatch ? slugMatch[1] : "";

        // Find matching ESPN game
        var events = await fetchESPN();
        var info = null;
        for (var i = 0; i < events.length; i++) {
            var comp = events[i].competitions[0];
            var g = buildGameInfo(comp);
            if (g && (g.homeSlug === slug || g.awaySlug === slug)) {
                info = g;
                break;
            }
        }

        if (info) {
            var scoreStr = info.statusState === "in" || info.statusState === "post"
                ? info.awayAbbr + " " + info.awayScore + " \u2014 " + info.homeAbbr + " " + info.homeScore
                : "";
            return JSON.stringify([{
                title: info.title + (scoreStr ? " (" + scoreStr + ")" : ""),
                image: info.image,
                description: info.description,
                aliases: scoreStr || "Upcoming",
                airdate: info.statusStr,
                href: url
            }]);
        }

        // Fallback — find team name from slug
        var teamName = slug.replace(/-live$/, "").replace(/-/g, " ").replace(/\b\w/g, function(c) { return c.toUpperCase(); });
        return JSON.stringify([{
            title: teamName,
            image: ICON,
            description: "Live MLB stream \u2014 HOME and AWAY feeds available.",
            aliases: "MLB WebCast",
            airdate: "Live",
            href: url
        }]);
    } catch (e) {
        return JSON.stringify([{ title: "MLB Stream", image: ICON, description: "Live MLB stream.", aliases: "MLB WebCast", airdate: "Live", href: url }]);
    }
}

async function extractEpisodes(url) {
    try {
        var res = await soraFetch(url, { headers: { "User-Agent": UA } });
        var html = await getText(res);

        var homeMatch = html.match(/href="(https:\/\/mlbwebcast\.com\/stream\/[^"]+\.html)[^"]*"[^>]*>[\s\S]{0,300}?HOME/);
        var awayMatch = html.match(/href="(https:\/\/mlbwebcast\.com\/stream\/[^"]+\.html)[^"]*"[^>]*>[\s\S]{0,300}?AWAY/);

        var sources = [];
        if (homeMatch) sources.push({ title: "HOME", url: homeMatch[1] });
        if (awayMatch) sources.push({ title: "AWAY", url: awayMatch[1] });

        if (sources.length === 0) return JSON.stringify([]);
        return JSON.stringify([{ number: 1, title: "Live Stream", href: url, sources: sources }]);
    } catch (e) {
        return JSON.stringify([]);
    }
}

async function extractStreamUrl(url) {
    try {
        url = url.split("?")[0];
        var res = await soraFetch(url, { headers: { "User-Agent": UA, "Referer": "https://mlbwebcast.com/" } });
        var html = await getText(res);

        var dMatch = html.match(/var\s+_d\s*=\s*\[(\d+)\s*,\s*'([^']+)'\s*,\s*'([^']+)'\]/);
        if (!dMatch) return JSON.stringify(null);

        var base = url.substring(0, url.lastIndexOf("/") + 1);
        var checkUrl = base + "check_stream.php?id=" + dMatch[1] + "&ts=" + dMatch[2] + "&pt=" + dMatch[3];

        var checkRes = await soraFetch(checkUrl, { headers: { "Referer": url, "User-Agent": UA } });
        var data = await getJson(checkRes);

        if (!data || !data.url) return JSON.stringify(null);
        return JSON.stringify({ streams: [{ url: data.url, quality: "HD", subtitles: [], headers: {} }], subtitles: [] });
    } catch (e) {
        return JSON.stringify(null);
    }
}
