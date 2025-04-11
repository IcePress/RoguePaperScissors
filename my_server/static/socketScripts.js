//Skapar socket här så att koden kan använda skicka socket signaler utanför $(document).ready(()
socket = null;

//den personliga datan för varje spelare.
jsUserData = {
    "gameId" : null,    //används för att komma åt spelet i servern
    "game" : null, 
    "room" : null,      //används för att komma åt alla spelare i pågående spel
    "userSid" : null,       //används för att komma åt dig själv genom socket io
    "opponentSid" : null,   //används för att komma åt motståndaren genom socket io
    "playerUserNum" : null,         //används för att skilja spelare 1 mot 2 i spelet
    "playerOpponentNum" : null,     //används för att skilja spelare 1 mot 2 i spelet
    "userSes" : null,       //kopia av session user, ifall error
    "cardRoster": []
}

//Endast för debug, loggar data
function logJsData(){
    console.log("CURRENT DATA: ------")
    console.log("   x personalGameId = \n  x", jsUserData['gameId'])
    console.log("   x personalGame = \n  x", jsUserData['game'])
    console.log("   x personalRoom = \n  x", jsUserData['room'])
    console.log("   x personalSid = \n  x", jsUserData['userSid'])
    console.log("   x personalOpponentSid = \n  x", jsUserData['opponentSid'])
    console.log("   x personalPlayerUserNum = \n  x", jsUserData['playerUserNum'])
    console.log("   x personalPlayerOpponentNum = \n  x", jsUserData['playerOpponentNum'])
    console.log("   x personalCardRoster = \n  x", jsUserData['cardRoster'])
    console.log("------")
}

//dubbel kollar att socket disconnectar då spelaren lämnar sidan
window.addEventListener("pagehide", () => {
    if (socket.connected) {
        socket.disconnect();
    }
});

$(document).ready(() => {

    socket = io();


    /*socket.on('gameRoomJoined', (data) => {
        console.log("- Joined game!: ", data['room'])
        decideWinner(data['playerCard1'], data['playerCard2'])
    })*/

    //Spelet tar emot spelarnas kort efter rundan och skickar vidare till spellogiken
    socket.on('socketRecieveExecuteRound', (data) => {
        jsUserData['game'] = data['game']
        console.log("- Round recieved. Game recieved", jsUserData['game'])
        decideWinner(data['playerCard1'], data['playerCard2'])
    })

    //endast för debug
    socket.on('sendUserSid', (data) => {
        console.log(data['name'] + ": \nPlayer number: " + data['user'] + " \nPlayer SID: " + data['sid'])
    })

    //skriver ut spelarnas kort från rundan på rätt plats
    socket.on('pasteCards', (data) => {
        console.log("Pasting " + jsUserData['playerUserNum'] + " card: ", data["userCard"])
        console.log("Pasting " + jsUserData['playerOpponentNum'] + " card: ", data["opponentCard"])

        userCardDiv = createDivCards([data['userCard']])[0]
        opponentCardDiv = createDivCards([data['opponentCard']])[0]

        userSocketId = jsUserData['playerUserNum'] + "CardSocket"
        

        //document.getElementById("userCardSocket").innerHTML = userCardDiv;
        document.getElementById("opponentCardSocket").innerHTML = opponentCardDiv;

    })

    //tar emot spelarnas SIDs för att spara i personliga datan (jsUserData)
    socket.on('storePlayerSids', (data) => {
        //console.log(data)
        jsUserData['userSid'] = data['userSid']
        jsUserData['room'] = data['room']
        jsUserData['opponentSid'] = data['opponentSid']

        logJsData();
    })

    //tar emot motståndarens SID (för andra spelaren) för att spara i personliga datan
    socket.on('storeOpponentSids', (data) => {
        console.log(data)
        jsUserData['opponentSid'] = data['opponentSid']

        logJsData();
    })

    //endast för debug
    socket.on('messageFromServer', (data) => {
        console.log(data['message'])
    })

    //berättar för spelaren med högst advantage att vänta på att motståndaren väljer kort
    socket.on('waitForOpponentCard', (data) => {
        console.log("12. Your opponent is currently picking a card..")
        synchronizeNextRound()
    })

    //berättar för spelaren med lägst advantage att välja ett kort, och skickar även dessa kort
    socket.on('chooseCardEmitRecieve', (data) => {
        console.log("12. You must pick a card!!")

        $.ajax({
            type: "POST",
            url: "/getGameData",
            data: JSON.stringify(jsUserData),
            dataType: "json",
            contentType: "application/json",
            success: function (response) {
                //game levels decide what cards appear
                pickingCard = true;
                chooseCardDiv(true)

                $.ajax({
                    type: "POST",
                    url: "/getPickCards",
                    data: JSON.stringify(jsUserData),
                    dataType: "json",
                    contentType: "application/json",
                    success: function (response2) {
                        cardList = response2
                        jsUserData['cardRoster'] = cardList
                        console.log(cardList)
                
                        let divCardList = createDivCards(cardList)
                        for (let i = 0; i < divCardList.length; i++){
                            $("#pickCardHand").append(divCardList[i]);
                        }

                        updateGameHtml(response)
                    }
                })
            }
        });
    })

    //om spelarna lyckas förlora hela spelet båda två
    socket.on('conclusionTie', (data) => {
        console.log("YOU TIED")
        document.getElementById("gameOverMessage").innerHTML = "YOU TIED";
        $("#theInGameRoundDiv").hide()
        $("#theGameOverDiv").show()
    })

    //om spelaren förlorar hela spelet
    socket.on('conclusionGameOver', (data) => {
        console.log("YOU LOST")
        document.getElementById("gameOverMessage").innerHTML = "YOU LOST";
        $("#theInGameRoundDiv").hide()
        $("#theGameOverDiv").show()
    })

    //om spelaren vinner hela spelet
    socket.on('conclusionWin', (data) => {
        console.log("YOU WON")
        document.getElementById("gameOverMessage").innerHTML = "YOU WON";
        $("#theInGameRoundDiv").hide()
        $("#theGameOverDiv").show()
    })

    //Sparar spelet och spelets ID till personliga datan, och börjar spelet
    socket.on('redirectToGame', (data) => {
        jsUserData['game'] = data['game']
        jsUserData['gameId'] = data['game']['gameId']
        logJsData();

        console.log("1. redirected to game")
        $.ajax({
            type: "POST",
            url: "/setPlayerSessions",
            data: JSON.stringify(data['game']),
            dataType: "json",
            contentType: "application/json",
            success: function (response) {
                console.log("2. INITIATE GAME with level 1")
                startNewLevel()
            }
        });
    });

    //Kollar om spelet ska skapa en ny level eller inte. Oavsett skapas en ny runda.
    socket.on("goToNextRound", function (data) {
        console.log("11. let's see if we increase level or not?:")
        discardCards()
        $.ajax({
            type: "POST",
            url: "/checkForGameOver",
            data: JSON.stringify(jsUserData),
            dataType: "json",
            contentType: "application/json",
            success: function (response) {
                $("#waitingForOpponent").hide()
                console.log("CHECKING GAME OVER")
                if (response == "game over"){
                    socket.emit('gameOver', {
                        "jsData": jsUserData
                    })
                }else{
                    if (data['variant'] == "level"){
                        console.log("- yup, let's increase the level too")
                        socket.emit('choosingCardStage', {
                            "jsData": jsUserData
                        })
            
                        startNewLevel()
                    }else{
                        console.log("- nope, let's just increase the round")
                    }
                    startNewRound()
                }
            }
        });
    });

    //Set element when opponent plays anything
    socket.on("updateHtmlForOpponent", function (data) {
        console.log("- - element html has been pasted")
        
    })
    

    //------------------------------------------------Create/Join game genom main menu-------------------------------------------------//
    $("#btnCreateGame").click(() => {
        $("#btnCreateGame").hide()
        $("#btnJoinGame").hide()
                    
        //skapar html element för att skapa eller gå med i spel
        let createdCode = `
        <div class="my-4 align-items-center" id="createdCodeSectionContent">
            <div class="row align-items-center">
                <div class="border p-4 col text-center createdElement">
                    <b>
                        Hosting Game Code:
                    </b>
                    <div>
                        <b>
                            <button id="hostGameCodeButton">
                                Host
                            </button>
                        </b>
                    </div>
                    <div id="hostGameCodeSection">
                                
                    </div>
                </div>

                <div class="border p-4 col text-center createdElement">
                    <b>
                        Enter Game Code:
                    </b>

                    <div>
                        <table>
                            <tr>
                                <td>Enter Game Code:</td>
                                <td>
                                    <input type="number" id="enterGameCodeSearch">
                                </td>
                            </tr>
                            <tr>
                                <td colspan="2">
                                    <button type="submit" id="validateGameCodeForm">
                                        search
                                    </button>
                                </td>
                            </tr>
                        </table>
                        <p id="failSearchGameResponse"></p>
                    </div>
                </div>
            </div>
            <div class="row align-items-center">
                <button class="my-2 btn btn-info cancelButton" onclick="cancelGameCode();">
                    Cancel
                </button>
            </div>
        </div>`
        $("#createdCodeSection").html(createdCode);

        //sök efter aktiva spel i servern
        $("#validateGameCodeForm").click(() => {
            jsUserData['gameId'] = document.getElementById("enterGameCodeSearch").value;
            jsUserData['room'] = String(document.getElementById("enterGameCodeSearch").value)

            postData = {
                "gameId": jsUserData['gameId'],
                "room": jsUserData['room']
            }
                
            $.ajax({
                type: "POST",
                url: "/enterGame",
                data: JSON.stringify(postData),
                dataType: "json",
                contentType: "application/json",
                success: function (newResponse) {
                    if ((newResponse == "Not logged in") || (newResponse == "Game not found")){
                        document.getElementById("failSearchGameResponse").innerHTML = newResponse;
                    }else{
                        jsUserData['playerUserNum'] = 'player2'
                        jsUserData['playerOpponentNum'] = 'player1'
                        console.log("next player joins the open game")
                        console.log("JOINING ROOM: ", jsUserData['gameId'])
                        emitData = jsUserData
                        console.log(emitData)
                        socket.emit('join', emitData);
                    }
                }
            });
        });

        //skapa ett "open" spel i servern som väntar på en till spelare innan den skapar det faktiska spelet
        $("#hostGameCodeButton").click(() => {
            $.ajax({
                type: "POST",
                url: "/getGameCode",
                data: JSON.stringify(jsUserData['userSes']),
                dataType: "json",
                contentType: "application/json",
                success: function (response) { 
                    
                    jsUserData['gameId'] = response;
                    jsUserData['room'] = String(response);
                    console.log("first player joins/creates the open game")
                    jsUserData['playerUserNum'] = 'player1'
                    jsUserData['playerOpponentNum'] = 'player2'
                    console.log("JOINING ROOM: ", jsUserData['gameId'])
                    
                    emitData = jsUserData
                    console.log(emitData)
                    socket.emit('join', emitData);

                    $("#hostGameCodeButton").hide()
                    let hostCode = `
                        <div id="hostGameCodeContent">

                            <b>
                                <h2>
                                ` + jsUserData['gameId'] + `
                                </h2>
                            </b>
                            
                            <button id="hostGameCodeCancelButton">
                                Stop Hosting
                            </button>
                            
                        </div>`
                    $("#hostGameCodeSection").html(hostCode);

                    $("#hostGameCodeCancelButton").click(() => {
                        socket.emit('leave', {
                            "room": jsUserData['gameId']
                        });
                        $("#hostGameCodeButton").show()
                        const element = document.getElementById("hostGameCodeContent");
                        element.remove(); 
                    });
                }
            })
        });
    })

    //skickar visare signalen för att uppdatera spelet för hela rummet
    socket.on('updateGameInRoom', function(data) {
        postData = {
            "game": data['game'],
            "gameId": jsUserData['gameId']
        }
        $.ajax({
            type: "POST",
            url: "/updateGame",
            data: JSON.stringify(postData),
            dataType: "json",
            contentType: "application/json",
            success: function (gameId) {
                console.log("   ((GAME SUCCESSFULLY RECIEVED))")
                $.ajax({
                    type: "POST",
                    url: "/getGameData",
                    data: JSON.stringify(jsUserData),
                    dataType: "json",
                    contentType: "application/json",
                    success: function (response) {

                        updateGameHtml(response)
                        
                    }
                });
            }
        });
    });
})

