async function test(){
    const YEAR = 2025;
    const SEASON_TYPE = 2;
    const URL = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${YEAR}&seasontype=${SEASON_TYPE}&week=`
    
    for(let week = 1; week <= 19; week++) {
        const response = await fetch(`${URL}${week}`)
        if(!response.ok) { console.error ('Failed connection')}
        const data = await response.json()
        
        for(const event of data.events) {
            const gameId = event.id
            const gameWeek = event.week?.number
            
            
            const homeTeam = event.competitions[0].competitors[0].team.displayName
            const awayTeam = event.competitions[0].competitors[1].team.displayName

            const winner = event.competitions[0].competitors.find(team => team.winner === true)?.team.displayName || 'TBD'
            console.log(`Game ID: ${gameId}, Week: ${gameWeek}, Home Team: ${homeTeam}, Away Team: ${awayTeam}, Winner: ${winner}`);
        }
    }

    
}

await test()