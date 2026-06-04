async function searchResults(keyword) {
    var results = [];
    var kw = keyword.toLowerCase().trim();

    // Empty, "all", or "mlb" → fetch today's games from homepage
    if (kw === "" || kw === "all" || kw === "mlb") {
        try {
            var response = await fetch("https://mlbwebcast.com/");
            var html = await response.text();

            // Extract matchup rows from the schedule table
            // Pattern: [Time] [Away Team page] [Home Team page] [Matchup title link] [Watch link]
            var rowRegex = /href="(https:\/\/mlbwebcast\.com\/[^"]+\/)"\s*[^>]*>[^<]*Watch[^<]*<\/a>/g;
            var titleRegex = /\[([^\]]+(?:@|vs\.?)[^\]]+(?:June|July|Aug|Sep|Oct|Nov|Dec|Jan|Feb|Mar|Apr|May)\s+\d+[^\]]*)\]\(<[^>]*>\)/g;

            // Simpler approach: find all matchup title+watch link pairs
            var matchupRegex = /(\d+:\d+[^\|]*?)\|[^|]*\|[^|]*\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*\[Watch\]\(([^)]+)\)/g;
            var match;

            // Parse schedule table rows - look for time | logos | matchup title | watch link pattern
            var scheduleRegex = /(\d{1,2}:\d{2})[^\n]*?\[([^\]]+)\]\((https:\/\/mlbwebcast\.com\/[^)]+)\)[^\n]*?\[Watch\]/g;

            while ((match = scheduleRegex.exec(html)) !== null) {
                var time = match[1];
                var title = match[2];
                var watchUrl = match[3];

                // Clean up title - remove date suffix
                var cleanTitle = title.replace(/\s+(?:Jan|Feb|Mar|Apr|May|Jun|July?|Aug|Sep|Oct|Nov|Dec)\w*\s+\d+,?\s*\d{4}$/i, "").trim();

                results.push({
                    title: time + " — " + cleanTitle,
                    image: "https://mlbwebcast.com/wp-content/uploads/2023/02/MLB-WEBCAST-LOGO.webp",
                    href: watchUrl
                });
            }
        } catch (e) {}
        return JSON.stringify(results);
    }

    // Keyword search — match against all teams
    var teams = [
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

    for (var i = 0; i < teams.length; i++) {
        var team = teams[i];
        if (team.name.toLowerCase().indexOf(kw) !== -1) {
            results.push({
                title: team.name,
                image: "https://mlbwebcast.com/wp-content/uploads/2023/02/MLB-WEBCAST-LOGO.webp",
                href: "https://mlbwebcast.com/" + team.slug + "/"
            });
        }
    }
    return JSON.stringify(results);
}

async function extractDetails(url) {
    try {
        var response = await fetch(url);
        var html = await response.text();

        var homeMatch = html.match(/href="(https:\/\/mlbwebcast\.com\/stream\/[^"]+\.html)[^"]*"\s*[^>]*>\s*HOME/);
        var awayMatch = html.match(/href="(https:\/\/mlbwebcast\.com\/stream\/[^"]+\.html)[^"]*"\s*[^>]*>\s*AWAY/);

        var titleMatch = html.match(/<title>([^<]+)<\/title>/);
        var title = titleMatch ? titleMatch[1].replace(" Live Stream Free Online", "").trim() : "MLB Stream";

        var matchupMatch = html.match(/# \[([^\]]+)\]/);
        var description = matchupMatch ? matchupMatch[1] : title;

        var streams = [];
        if (homeMatch) streams.push({ title: "HOME", url: homeMatch[1] });
        if (awayMatch) streams.push({ title: "AWAY", url: awayMatch[1] });

        return JSON.stringify({
            title: title,
            image: "https://mlbwebcast.com/wp-content/uploads/2023/02/MLB-WEBCAST-LOGO.webp",
            description: description,
            episodes: [{ title: "Streams", sources: streams }]
        });
    } catch (e) {
        return JSON.stringify({ title: "MLB Stream", description: "", episodes: [] });
    }
}

async function extractStreamUrl(url) {
    try {
        var response = await fetch(url);
        var html = await response.text();

        var dMatch = html.match(/var\s+_d\s*=\s*\[(\d+)\s*,\s*'([^']+)'\s*,\s*'([^']+)'\]/);
        if (!dMatch) return JSON.stringify(null);

        var id = dMatch[1];
        var ts = dMatch[2];
        var pt = dMatch[3];

        var base = url.substring(0, url.lastIndexOf("/") + 1);
        var checkUrl = base + "check_stream.php?id=" + id + "&ts=" + ts + "&pt=" + pt;

        var checkResponse = await fetch(checkUrl, {
            headers: { "Referer": url }
        });
        var data = await checkResponse.json();

        if (data && data.url) {
            return JSON.stringify(data.url);
        }
        return JSON.stringify(null);
    } catch (e) {
        return JSON.stringify(null);
    }
}

async function extractEpisodes(url) {
    return JSON.stringify([]);
}
