// MLB WebCast Live Module
// Fetches today's games from mlbwebcast.com
// HOME/AWAY streams via check_stream.php with server-baked _d tokens

async function soraFetch(url, options) {
    options = options || { headers: {}, method: 'GET', body: null };
    try {
        if (typeof fetchv2 !== 'undefined') {
            return await fetchv2(
                url,
                options.headers || {},
                options.method || 'GET',
                options.body || null,
                true,
                options.encoding || 'utf-8'
            );
        } else {
            return await fetch(url, options);
        }
    } catch (e) {
        try {
            return await fetch(url, options);
        } catch (err) {
            return null;
        }
    }
}

async function getText(res) {
    if (!res) return '';
    try {
        if (typeof res.text === 'function') return await res.text();
        if (typeof res.json === 'function') return JSON.stringify(await res.json());
        return String(res);
    } catch (e) {
        return '';
    }
}

async function getJson(res) {
    if (!res) return null;
    try {
        if (typeof res.json === 'function') return await res.json();
        var t = typeof res.text === 'function' ? await res.text() : String(res);
        return JSON.parse(t);
    } catch (e) {
        return null;
    }
}

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

var ICON = "https://raw.githubusercontent.com/JayGxnzalez/MLB-Webcast/main/MLBWC.png";

async function searchResults(keyword) {
    var results = [];
    var kw = keyword.toLowerCase().trim();

    if (kw === "" || kw === "all" || kw === "mlb") {
        try {
            var res = await soraFetch("https://mlbwebcast.com/");
            var html = await getText(res);
            // Match markdown table rows: | TIME | ... | ... | [Title](url) | [Watch](url) |
            var scheduleRegex = /\|\s*(\d{1,2}:\d{2})\s*\|[^|]*\|[^|]*\|\s*\[([^\]]+)\]\([^)]+\)\s*\|\s*\[Watch\]\(([^)]+)\)/g;
            var match;
            while ((match = scheduleRegex.exec(html)) !== null) {
                var time = match[1];
                var title = match[2].replace(/\s+(?:Jan|Feb|Mar|Apr|May|Jun|July?|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+\d+,?\s*\d{4}$/i, "").trim();
                var watchUrl = match[3];
                results.push({
                    title: time + " \u2014 " + title,
                    image: ICON,
                    href: watchUrl
                });
            }
        } catch (e) {}
        return JSON.stringify(results);
    }

    for (var i = 0; i < TEAMS.length; i++) {
        if (TEAMS[i].name.toLowerCase().indexOf(kw) !== -1) {
            results.push({
                title: TEAMS[i].name,
                image: ICON,
                href: "https://mlbwebcast.com/" + TEAMS[i].slug + "/"
            });
        }
    }
    return JSON.stringify(results);
}

async function extractDetails(url) {
    try {
        var res = await soraFetch(url);
        var html = await getText(res);
        var titleMatch = html.match(/<title>([^<]+)<\/title>/);
        var title = titleMatch ? titleMatch[1].replace(/\s*[\|\-].*$/, "").trim() : "MLB Stream";
        return JSON.stringify([{
            description: "Live MLB stream — HOME and AWAY feeds available.",
            aliases: title,
            airdate: "Live"
        }]);
    } catch (e) {
        return JSON.stringify([{ description: "Live MLB stream.", aliases: "", airdate: "Live" }]);
    }
}

async function extractEpisodes(url) {
    try {
        var res = await soraFetch(url);
        var html = await getText(res);

        var episodes = [];

        var homeMatch = html.match(/href="(https:\/\/mlbwebcast\.com\/stream\/[^"]+\.html)[^"]*"[^>]*>[\s\S]*?HOME/);
        var awayMatch = html.match(/href="(https:\/\/mlbwebcast\.com\/stream\/[^"]+\.html)[^"]*"[^>]*>[\s\S]*?AWAY/);

        if (homeMatch) {
            episodes.push({ href: homeMatch[1], number: 1, title: "HOME" });
        }
        if (awayMatch) {
            episodes.push({ href: awayMatch[1], number: 2, title: "AWAY" });
        }

        return JSON.stringify(episodes);
    } catch (e) {
        return JSON.stringify([]);
    }
}

async function extractStreamUrl(url) {
    try {
        url = url.split("?")[0];
        var res = await soraFetch(url, {
            headers: { "Referer": "https://mlbwebcast.com/" },
            method: "GET",
            body: null
        });
        var html = await getText(res);

        var dMatch = html.match(/var\s+_d\s*=\s*\[(\d+)\s*,\s*'([^']+)'\s*,\s*'([^']+)'\]/);
        if (!dMatch) return JSON.stringify({ streams: [], subtitles: "" });

        var id = dMatch[1];
        var ts = dMatch[2];
        var pt = dMatch[3];

        var base = url.substring(0, url.lastIndexOf("/") + 1);
        var checkUrl = base + "check_stream.php?id=" + id + "&ts=" + ts + "&pt=" + pt;

        var checkRes = await soraFetch(checkUrl, {
            headers: { "Referer": url },
            method: "GET",
            body: null
        });
        var data = await getJson(checkRes);

        if (!data || !data.url) return JSON.stringify({ streams: [], subtitles: "" });

        return JSON.stringify({
            streams: [{ title: "MLB WebCast", streamUrl: data.url, headers: {} }],
            subtitles: ""
        });
    } catch (e) {
        return JSON.stringify({ streams: [], subtitles: "" });
    }
}
