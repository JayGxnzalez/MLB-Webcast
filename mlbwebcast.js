// MLB WebCast Live Module
// HOME & AWAY streams for all 30 MLB teams via mlbwebcast.com

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
        if (typeof res.json === "function") return JSON.stringify(await res.json());
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

// Team logos from MLB's official CDN (SVG, widely supported)
var TEAM_LOGOS = {
    "arizona-diamondbacks-live": "https://www.mlbstatic.com/team-logos/109.svg",
    "atlanta-braves-live": "https://www.mlbstatic.com/team-logos/144.svg",
    "baltimore-orioles-live": "https://www.mlbstatic.com/team-logos/110.svg",
    "boston-red-sox-live": "https://www.mlbstatic.com/team-logos/111.svg",
    "chicago-cubs-live": "https://www.mlbstatic.com/team-logos/112.svg",
    "chicago-white-sox-live": "https://www.mlbstatic.com/team-logos/145.svg",
    "cincinnati-reds-live": "https://www.mlbstatic.com/team-logos/113.svg",
    "cleveland-guardians-live": "https://www.mlbstatic.com/team-logos/114.svg",
    "colorado-rockies-live": "https://www.mlbstatic.com/team-logos/115.svg",
    "detroit-tigers-live": "https://www.mlbstatic.com/team-logos/116.svg",
    "houston-astros-live": "https://www.mlbstatic.com/team-logos/117.svg",
    "kansas-city-royals-live": "https://www.mlbstatic.com/team-logos/118.svg",
    "los-angeles-angels-live": "https://www.mlbstatic.com/team-logos/108.svg",
    "los-angeles-dodgers-live": "https://www.mlbstatic.com/team-logos/119.svg",
    "miami-marlins-live": "https://www.mlbstatic.com/team-logos/146.svg",
    "milwaukee-brewers-live": "https://www.mlbstatic.com/team-logos/158.svg",
    "minnesota-twins-live": "https://www.mlbstatic.com/team-logos/142.svg",
    "new-york-mets-live": "https://www.mlbstatic.com/team-logos/121.svg",
    "new-york-yankees-live": "https://www.mlbstatic.com/team-logos/147.svg",
    "oakland-athletics-live": "https://www.mlbstatic.com/team-logos/133.svg",
    "philadelphia-phillies-live": "https://www.mlbstatic.com/team-logos/143.svg",
    "pittsburgh-pirates-live": "https://www.mlbstatic.com/team-logos/134.svg",
    "san-diego-padres-live": "https://www.mlbstatic.com/team-logos/135.svg",
    "san-francisco-giants-live": "https://www.mlbstatic.com/team-logos/137.svg",
    "seattle-mariners-live": "https://www.mlbstatic.com/team-logos/136.svg",
    "st-louis-cardinals-live": "https://www.mlbstatic.com/team-logos/138.svg",
    "tampa-bay-rays-live": "https://www.mlbstatic.com/team-logos/139.svg",
    "texas-rangers-live": "https://www.mlbstatic.com/team-logos/140.svg",
    "toronto-blue-jays-live": "https://www.mlbstatic.com/team-logos/141.svg",
    "washington-nationals-live": "https://www.mlbstatic.com/team-logos/120.svg",
    "mlb-network-live": ICON,
    "fox-sports-live": ICON
};

var TEAMS = [
    { name: "Arizona Diamondbacks", slug: "arizona-diamondbacks-live" },
    { name: "Atlanta Braves", slug: "atlanta-braves-live" },
    { name: "Baltimore Orioles", slug: "baltimore-orioles-live" },
    { name: "Boston Red Sox", slug: "boston-red-sox-live" },
    { name: "Chicago Cubs", slug: "chicago-cubs-live" },
    { name: "Chicago White Sox", slug: "chicago-white-sox-live" },
    { name: "Cincinnati Reds", slug: "cincinnati-reds-live" },
    { name: "Cleveland Guardians", slug: "cleveland-guardians-live" },
    { name: "Colorado Rockies", slug: "colorado-rockies-live" },
    { name: "Detroit Tigers", slug: "detroit-tigers-live" },
    { name: "Houston Astros", slug: "houston-astros-live" },
    { name: "Kansas City Royals", slug: "kansas-city-royals-live" },
    { name: "Los Angeles Angels", slug: "los-angeles-angels-live" },
    { name: "Los Angeles Dodgers", slug: "los-angeles-dodgers-live" },
    { name: "Miami Marlins", slug: "miami-marlins-live" },
    { name: "Milwaukee Brewers", slug: "milwaukee-brewers-live" },
    { name: "Minnesota Twins", slug: "minnesota-twins-live" },
    { name: "New York Mets", slug: "new-york-mets-live" },
    { name: "New York Yankees", slug: "new-york-yankees-live" },
    { name: "Oakland Athletics", slug: "oakland-athletics-live" },
    { name: "Philadelphia Phillies", slug: "philadelphia-phillies-live" },
    { name: "Pittsburgh Pirates", slug: "pittsburgh-pirates-live" },
    { name: "San Diego Padres", slug: "san-diego-padres-live" },
    { name: "San Francisco Giants", slug: "san-francisco-giants-live" },
    { name: "Seattle Mariners", slug: "seattle-mariners-live" },
    { name: "St. Louis Cardinals", slug: "st-louis-cardinals-live" },
    { name: "Tampa Bay Rays", slug: "tampa-bay-rays-live" },
    { name: "Texas Rangers", slug: "texas-rangers-live" },
    { name: "Toronto Blue Jays", slug: "toronto-blue-jays-live" },
    { name: "Washington Nationals", slug: "washington-nationals-live" },
    { name: "MLB Network", slug: "mlb-network-live" },
    { name: "Fox Sports", slug: "fox-sports-live" }
];

function slugFromUrl(url) {
    var m = url.match(/mlbwebcast\.com\/([^\/]+)\/?$/);
    return m ? m[1] : "";
}

function logoFromUrl(url) {
    return TEAM_LOGOS[slugFromUrl(url)] || ICON;
}

async function searchResults(keyword) {
    var results = [];
    var kw = keyword.toLowerCase().trim();

    if (kw === "" || kw === "all" || kw === "mlb") {
        try {
            var res = await soraFetch("https://mlbwebcast.com/", { headers: { "User-Agent": UA } });
            var html = await getText(res);
            // Match markdown table: | TIME | ... | ... | [Title](url) | [Watch](watchUrl) |
            var scheduleRegex = /\|\s*(\d{1,2}:\d{2})\s*\|[^|]*\|[^|]*\|\s*\[([^\]]+)\]\([^)]+\)\s*\|\s*\[Watch\]\(([^)]+)\)/g;
            var match;
            while ((match = scheduleRegex.exec(html)) !== null) {
                var time = match[1];
                var title = match[2].replace(/\s+(?:Jan|Feb|Mar|Apr|May|Jun|July?|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+\d+,?\s*\d{4}$/i, "").trim();
                var watchUrl = match[3];
                results.push({ title: time + " \u2014 " + title, image: logoFromUrl(watchUrl), href: watchUrl });
            }
        } catch (e) {}
        if (results.length === 0) {
            for (var i = 0; i < TEAMS.length; i++) {
                var url2 = "https://mlbwebcast.com/" + TEAMS[i].slug + "/";
                results.push({ title: TEAMS[i].name, image: TEAM_LOGOS[TEAMS[i].slug] || ICON, href: url2 });
            }
        }
        return JSON.stringify(results);
    }

    for (var i = 0; i < TEAMS.length; i++) {
        if (TEAMS[i].name.toLowerCase().indexOf(kw) !== -1) {
            var url = "https://mlbwebcast.com/" + TEAMS[i].slug + "/";
            results.push({ title: TEAMS[i].name, image: TEAM_LOGOS[TEAMS[i].slug] || ICON, href: url });
        }
    }
    return JSON.stringify(results);
}

async function extractDetails(url) {
    try {
        var res = await soraFetch(url, { headers: { "User-Agent": UA } });
        var html = await getText(res);

        var titleMatch = html.match(/<title>([^<]+)<\/title>/);
        var title = titleMatch ? titleMatch[1].replace(/\s*[\|\-].*$/, "").trim() : "MLB Stream";

        // Try to extract matchup from page — look for away @ home in heading
        var matchupMatch = html.match(/([A-Z][a-z]+ (?:[A-Z][a-z]+ )?(?:Sox|Cubs|Mets|Rays|Jays|Reds|Twins|Braves|Padres|Giants|Angels|Astros|Tigers|Royals|Brewers|Rockies|Orioles|Marlins|Yankees|Pirates|Rangers|Phillies|Mariners|Cardinals|Nationals|Guardians|Dodgers|Athletics|Diamondbacks))\s*@\s*([A-Z][a-z]+ (?:[A-Z][a-z]+ )?(?:Sox|Cubs|Mets|Rays|Jays|Reds|Twins|Braves|Padres|Giants|Angels|Astros|Tigers|Royals|Brewers|Rockies|Orioles|Marlins|Yankees|Pirates|Rangers|Phillies|Mariners|Cardinals|Nationals|Guardians|Dodgers|Athletics|Diamondbacks))/i);

        var description = matchupMatch ? matchupMatch[0] : "Live MLB stream \u2014 HOME and AWAY feeds available.";

        return JSON.stringify([{ title: title, image: logoFromUrl(url), description: description, aliases: "MLB WebCast", airdate: "Live", href: url }]);
    } catch (e) {
        return JSON.stringify([{ title: "MLB Stream", image: ICON, description: "Live MLB stream.", aliases: "MLB WebCast", airdate: "Live", href: url }]);
    }
}

async function extractEpisodes(url) {
    try {
        var res = await soraFetch(url, { headers: { "User-Agent": UA } });
        var html = await getText(res);

        var episodes = [];

        // Extract HOME link + away team logo
        var homeMatch = html.match(/href="(https:\/\/mlbwebcast\.com\/stream\/[^"]+\.html)[^"]*"[^>]*>[\s\S]{0,300}?HOME/);
        // Extract AWAY link + home team logo
        var awayMatch = html.match(/href="(https:\/\/mlbwebcast\.com\/stream\/[^"]+\.html)[^"]*"[^>]*>[\s\S]{0,300}?AWAY/);

        // Try to get opponent team logo from schedule table on this page
        var awayTeamLogoMatch = html.match(/class="team dracula[^"]*"[^>]*>\s*<a[^>]*href="(https:\/\/mlbwebcast\.com\/([^\/]+)-live\/?)"/);
        var homeTeamLogoMatch = html.match(/class="team dracula[^"]*"[^>]*>\s*<a[^>]*href="(https:\/\/mlbwebcast\.com\/([^\/]+)-live\/?)"/g);

        var pageSlug = slugFromUrl(url);
        var pageLogo = TEAM_LOGOS[pageSlug] || ICON;

        // For away team logo: find the other team's slug in the page
        var otherSlug = "";
        var allTeamLinks = html.match(/href="https:\/\/mlbwebcast\.com\/([a-z-]+)-live\/?"/g) || [];
        for (var i = 0; i < allTeamLinks.length; i++) {
            var m = allTeamLinks[i].match(/\/([a-z-]+)-live/);
            if (m && m[1] + "-live" !== pageSlug) {
                otherSlug = m[1] + "-live";
                break;
            }
        }
        var otherLogo = TEAM_LOGOS[otherSlug] || ICON;

        if (homeMatch) episodes.push({ number: 1, title: "HOME", href: homeMatch[1], image: pageLogo });
        if (awayMatch) episodes.push({ number: 2, title: "AWAY", href: awayMatch[1], image: otherLogo });

        return JSON.stringify(episodes);
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
