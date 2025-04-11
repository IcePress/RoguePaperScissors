/*var gameplayStates = ["Round", "Upgrade", "Conclusion"];
var gameplayState = 0;
var roundPhases = ["Planning", "Reveal"]
var roundPhase = 0;*/

//Ser till att korten inte är låsta i början av spelet och att man inte kan lägga till kort
cardsLocked = false;
pickingCard = false;

/*function getGameplayState(){
    console.log("---- gameplayState: " + gameplayStates[gameplayState])
    return gameplayStates[gameplayState];
}
function getRoundPhase(){
    console.log("---- roundPhase: " + roundPhase[roundPhase])
    return roundPhases[roundPhase];
}*/

//tar emot en signal från socketScripts om att skapa en helt ny level (då tre rundor har gått)
function startNewLevel(){
    console.log("3. New level")
    $.ajax({
        type: "POST",
        url: "/getGameData",
        data: JSON.stringify(jsUserData),
        dataType: "json",
        contentType: "application/json",
        success: function (response) {
            chooseCardDiv(false)
            mainMenuDiv(false)
            cardList = response['game'][response['user']]['fullInventory']
            console.log("IN THIS CASE, GAME CURRENTLY LOOKS LIKE THIS:", response['game'])

            document.getElementById("cardHand").innerHTML = "";
            
            let divCardList = createDivCards(cardList)   
            for (let i = 0; i < divCardList.length; i++){
                $("#cardHand").append(divCardList[i]);
            }
            updateGameHtml(response)
        }
    });
}

//Den sista spelaren att lägga sitt kort skapar variabler för båda spelares kort och skickar de genom socket
function cardsFight(game){
    console.log("6. Card's fight start!")
    cycleRoundPhase();
    switch (getRoundPhase()){
        case "Planning":
        break;
        case "Reveal":
            let playerCard1 = {             //playerCard innehåller spelaren, kortet de lagt, och ifall de är "player1" eller "player2"
                "player": game["player1"],
                "card": game["player1Card"],
                "playerNum": "player1"
            }
            let playerCard2 = {
                "player": game["player2"],
                "card": game["player2Card"],
                "playerNum": "player2"
            }
            console.log("7. Signal the players to execute the round")
            socket.emit('socketExecuteRound', {
                'playerCard1': playerCard1,
                'playerCard2': playerCard2,
                'gameId': jsUserData['gameId'],
                'room': jsUserData['room']
            })
        break;
    }
}

/*function removeSlotCards(){
    var cardSocket1 = document.getElementById("userCardSocket");
    var cardSocket2 = document.getElementById("opponentCardSocket");

    if (cardSocket1.querySelector(".card")) {
        let divCard = cardSocket1.querySelector(".card")
        cardSocket1.removeChild(divCard)
    }
    if (cardSocket2.querySelector(".card")) {
        let divCard = cardSocket2.querySelector(".card")
        cardSocket2.removeChild(divCard)
    }
    checkForCardInSocket();
}*/

//båda spelare kollar ifall de vann, förlorade eller fick oavgjort
function decideWinner(playerCard1, playerCard2){
    console.log("8. Recieved gameplay signal")
    switch (playerCard1.card["cardClass"]){
        case "rock":
            switch (playerCard2.card["cardClass"]){
                case "rock":
                    //Tie
                    roundTie(playerCard1, playerCard2)
                break;
                case "paper":
                    //Player 2 win
                    roundWinner(playerCard2, playerCard1)
                break;
                case "scissors":
                    //Player 1 win
                    roundWinner(playerCard1, playerCard2)
                break;
            }
        break;
        case "paper":
            switch (playerCard2.card["cardClass"]){
                case "rock":
                    //Player 1 win
                    roundWinner(playerCard1, playerCard2)
                break;
                case "paper":
                    //Tie
                    roundTie(playerCard1, playerCard2)
                break;
                case "scissors":
                    //Player 2 win
                    roundWinner(playerCard2, playerCard1)
                break;
            }
        break;
        case "scissors":
            switch (playerCard2.card["cardClass"]){
                case "rock":
                    //Player 2 win
                    roundWinner(playerCard2, playerCard1)
                break;
                case "paper":
                    //Player 1 win
                    roundWinner(playerCard1, playerCard2)
                break;
                case "scissors":
                    //Tie
                    roundTie(playerCard1, playerCard2)
                break;
            }
        break;
    }
}

//räknar ut hur mycket skada som spelarna tar, och animerar sedan deras agerande beroende på vilka kort de lagt
function roundWinner(attacker, defender){
    console.log("9. Round won by " + attacker['player']['name'])
    /*$.ajax({
        type: "POST",
        url: "/getGameData",
        data: JSON.stringify(jsUserData),
        dataType: "json",
        contentType: "application/json",
        success: function (response) {
            game = response['game']
            user = response['user']
            
            console.log("- Let's make sure only the winning player continues the code:")
            if (game[user]['id'] == attacker['player']['id']){
                postData = {
                    "playerNum": attacker['playerNum'],
                    "jsData": jsUserData
                }
                $.ajax({
                    type: "POST",
                    url: "/setRoundWinner",
                    data: JSON.stringify(postData),
                    dataType: "json",
                    contentType: "application/json",
                    success: function (response) {
                        console.log("- as the winner, adding a roundWin count + 1")
                        updateGame(response);
                    }
                });
            }
        }
    });*/

    let attack = attacker["card"]["ATK"]
    let attackClass = attacker['card']['cardClass']
    let defense = defender["card"]["DEF"]
    let defenderClass = defender['card']['cardClass']

    let attackerDefense = attacker["card"]["DEF"]
    let defenderAttack = defender["card"]["ATK"]

    function calcDmg(attackPower, defensePower){
        if ((attackPower - defensePower) < 0){
            return 0
        }else{
            return (attackPower - defensePower)
        }
    }

    console.log("10. Begin fight cycle")
    roundSection = 0
    let round = setInterval(executeRound, 1500)     //variabeln "round" runnar "executeRound" funktionen varje 1.5 sekunder

    function executeRound(){
        roundSection++;         //eftersom "roundSection" ökar varje gång "executeRound" körs, så går spelet frammåt
        
        switch(roundSection){
            case 1:     //Visar motståndarens kort
                console.log("- 10.1. zoom cards")
                $("#waitingForOpponent").hide()
                socket.emit("showCards", jsUserData)
            break;
            case 2:     //Animerar båda kort (låter spelarna få tid att se vilka kort som lagts)
                console.log("- 10.2. zoom cards")
                cardZoomInAnim(attacker)
                cardZoomInAnim(defender)
            break;
            case 3:     //Kortet som vann animeras ännu en gång, och beroende på kortets förmåga så lyses dess regler upp bredvid
                console.log("- 10.3. zoom attacker")
                cardZoomInAnim(attacker)
                if (attackClass == "paper"){
                    document.getElementById("instructionsPaper").style.color = "rgb(0, 106, 255)";
                }
                if (defenderClass == "scissors"){
                    document.getElementById("instructionsScissors").style.color = "rgb(255, 0, 0)";
                }
                
            break;
            case 4:     //Här attackerar det vinnande kortet (attacker) motståndarens kort (defender)
                jsUserData['game'][attacker['playerNum']]['roundWins']++; 
                console.log("- 10.4. deal damage")

                //om attacker kortet är "paper" får hen tillbaka HP bestående av den skada hen gör

                //om defender kortet är "rock", och hen lyckas försvara sig mot motståndarens attack med återstående 'block' så attackerar hen tillbaka med denna block

                //om 
                
                if (attackClass == "rock"){
                    damage(defender, attacker, calcDmg(attack, defense)) //deals damage to opponent
                }
                //om attacker kortet är "paper":
                if (attackClass == "paper"){
                    if (defenderClass == "rock" && (attack - defense < 0)){
                        //om defender kortet är "rock", och hen lyckas försvara sig mot motståndarens attack med återstående 'block' så attackerar hen tillbaka med denna block
                        document.getElementById("instructionsRock").style.color = "rgb(255, 0, 0)";
                        cardZoomInAnim(defender)
                        damage(attacker, defender, (attack - defense) * -1) //returns remaining defense to attacker
                    }else{
                        //Attacker gör skada och får tillbaka lika mycket HP själv
                        damage(attacker, defender, calcDmg(attack, defense) * -1) //heals yourself for damageAmount
                        damage(defender, attacker, calcDmg(attack, defense)) //deals damage to opponent
                    }
                }
                if (attackClass == "scissors"){
                    
                    damage(defender, attacker, calcDmg(attack, defense)) //deals damage
                    
                }

                if (defenderClass == "scissors"){
                    damage(attacker, defender, Math.round(defenderAttack/10)) //deals 10% dmg to attacker
                }
            break;
            case 5:
                console.log("- 10.5. send synchronize and wait for opponent to catch up before continuing")
                document.getElementById("instructionsRock").style.color = "rgb(0, 0, 0)";
                document.getElementById("instructionsPaper").style.color = "rgb(0, 0, 0)";
                document.getElementById("instructionsScissors").style.color = "rgb(0, 0, 0)";
                synchronizeNextRound()
                $("#waitingForOpponent").show()
            break;
            case 6:
                $("#waitingForOpponent").hide()
                clearInterval(round)
            break;
            default:
                $("#waitingForOpponent").hide()
                clearInterval(round)
            break;
        }
    }
}

function winStage(num, attacker, defender){
    switch(num){
        case 1:
            break;
    }
}


function synchronizeNextRound(){
    console.log("- - synchronizing...")
    $.ajax({
        type: "POST",
        url: "/synchronizeNextRound",
        data: JSON.stringify(jsUserData),
        dataType: "json",
        contentType: "application/json",
        success: function (response) {
            if (response['change']){
                console.log("- - (b) opponent was already done, continuing to next round")
                socket.emit('goToNextRound', {
                    "data": response,
                    "room": jsUserData['room']
                })
            }else{
                console.log("- - (a) let opponent continue instead")
            }
        }
    });
}

function startNewRound(){
    //first check 3 rounds have passed or if game is over
    console.log("New round---")
    /*$.ajax({
        type: "POST",
        url: "/getGameData",
        data: JSON.stringify(jsUserData),
        dataType: "json",
        contentType: "application/json",
        success: function (response) {*/
                $.ajax({
                    type: "POST",
                    url: "/newRoundPrep",
                    data: JSON.stringify(jsUserData),
                    dataType: "json",
                    contentType: "application/json",
                    success: function (response2) {
                        cardsLocked = false;
                        console.log(response2['game'])
                        updateGame(response2['game'])
                        //updateGameHtml(response2)
                    }
                });
            
    
        /*}
    });*/
}

function roundTie(attacker, defender){
    roundSection = 0
    let round = setInterval(executeRound, 1500)

    function executeRound(){
        roundSection++;
            
        switch(roundSection){
            case 1:
                $("#waitingForOpponent").hide()
                socket.emit("showCards", jsUserData)
            break;
            case 2:
                cardZoomInAnim(attacker)
                cardZoomInAnim(defender)
            break;
            case 3:
                cardZoomInAnim(attacker)
                cardZoomInAnim(defender)
            break;
            case 4:
                synchronizeNextRound()
                $("#waitingForOpponent").show()
            break;
            case 5:
                $("#waitingForOpponent").hide()
                clearInterval(round)
            break;
            default:
                $("#waitingForOpponent").hide()
                clearInterval(round)
            break;
            }
        }
}

function updateGame(newGame){
    
    console.log("   ((UPDATE GAME REQUEST))")

    socket.emit('updateGameSocket', {
        "game": newGame,
        "jsData": jsUserData
    })

}

const newDamage = (target, amount) => {
    $.ajax({
        type: "POST",
        url: "/getGameData",
        data: JSON.stringify(jsUserData),
        dataType: "json",
        contentType: "application/json",
        success: function (response) {
            damage(response[target], amount)
            updateGame(response)
        }
    });
}

function lockCard(){
    //send the locked card to room
    console.log("4. Card locked! Let's see if it get's registered...")
    $.ajax({
        type: "POST",
        url: "/getGameData",
        data: JSON.stringify(jsUserData),
        dataType: "json",
        contentType: "application/json",
        success: function (response) {
            
            var cardSocket1 = document.getElementById("userCardSocket");

            if (cardSocket1.querySelector(".card")) {
                let divCard = cardSocket1.querySelector(".card")
                var lockButton = document.getElementById("userLockCardButton");
                cardsLocked = true;
                lockButton.disabled = true;
 
                storeCardById(divCard.id, response['user'])
                divCard.draggable = false;
                var newCardSocket1 = document.getElementById("userCardSocket").innerHTML;

                //sendNewElement(newCardSocket1, "opponentCardSocket")
            }
        }
    });
}

//when certain elements are changed, update it for the opponent
/*function sendNewElement(elementHtml, locationId) {
    console.log("- sending card element to socket")
    data = {
        "element": elementHtml,
        "locationId": locationId,
        "opponentSid": jsUserData['opponentSid']
    }

    socket.emit("updateHtmlForOpponent", {
        "element": elementHtml,
        "locationId": locationId,
        "opponentSid": jsUserData['opponentSid']
    });
}*/





//-------Cycle through / initiate gameplayStates and roundPhases-------//
function cycleRoundPhase(){
    if (roundPhase >= (roundPhases.length - 1)){
        roundPhase == 0;
    } else {
        roundPhase++;
    }
}

//whenever a card is placed, register it and save it to gameDetails
function storeCardById(id, playerStr){
    console.log("- Trying to store the card by it's ID, let's just find the card first")
    $.ajax({
        type: "POST",
        url: "/getGameData",
        data: JSON.stringify(jsUserData),
        dataType: "json",
        contentType: "application/json",
        success: function (response) {
            respGame = response["game"]
            respPlayer = respGame[playerStr]

            console.log("error fix:")
            console.log("playerInventory: ", respPlayer["fullInventory"])
            console.log("cardId: ", id)

            for (let i = 0; i < respPlayer["fullInventory"].length; i++){
                if (respPlayer["fullInventory"][i]["id"] == id){
                    let tempCard = respPlayer["fullInventory"][i];
                    console.log("-- found the card as " + tempCard['name'] + ". Now comes storing ->")
                    postData = {
                        "card": tempCard,
                        "jsData": jsUserData
                    }
                    console.log("frozen1?")
                    $.ajax({
                        type: "POST",
                        url: "/playedCard",
                        data: JSON.stringify(postData),
                        dataType: "json",
                        contentType: "application/json",
                        success: function (response2) {
                            updateGame(response2['game'])
                            console.log("5. Card stored! Let's check if both cards are played:")
                            console.log("--- Player1's card:")
                            console.log(response2['game']['player1Card'])
                            console.log("--- Player2's card:")
                            console.log(response2['game']['player2Card'])
                            
                            //If both cards have been played, initiate the round
                            if (response2['bothCardsPlayed'] == true){
                                console.log("frozen2?")
                                cardsFight(response2['game'])
                            }else{
                                console.log("frozen3?")
                                $("#waitingForOpponent").show()
                            }
                        }
                    })
                    break;
                }
            }
        }
    });
}




//-----------------------------------All the ingame drop and drag functions------------------------------------------//
function allowDrop(ev) {
    if (!cardsLocked){
        ev.preventDefault();
    }
}
  
function drag(ev) {
    if (!cardsLocked){
        ev.dataTransfer.setData("text", ev.target.id);
    }
}
  
function drop(ev) {
    ev.preventDefault();
    var cardData = ev.dataTransfer.getData("text");
    var cardElement = document.getElementById(cardData);
    if (pickingCard){
        let ownedBool = cardElement.getAttribute("owned")
        if (ownedBool == "true"){
            console.log("- You already have this card!")
        }else{
            console.log("- this card works! Now let's remove the pickCard thingy")
            let pickCardHand = document.getElementById("pickCardHand"); 
            pickCardHand.innerHTML = '';
            chooseCardDiv(false);
            pickingCard = false

            $.ajax({
                type: "POST",
                url: "/levelReset",
                data: JSON.stringify(jsUserData['gameId']),
                dataType: "json",
                contentType: "application/json",
                success: function (response) {
                    console.log("successfully reset pickCard thingy")
                    console.log("Now trying to add card to inventory (card id: " + cardData + " )")
                    console.log("The current cardRoster looks like this: ", response['cardRoster'])
                    postData = {
                        "data": cardData,
                        "jsData": jsUserData
                    }
                    $.ajax({
                        type: "POST",
                        url: "/addCardToInventoryById",
                        data: JSON.stringify(postData),
                        dataType: "json",
                        contentType: "application/json",
                        success: function (response2) {
                            console.log("RESPONSE: ", response2)
                            jsUserData['cardRoster'] = []
                        }
                    });
                }
            });
            
        }
    }

    let dropZone = ev.target.closest(".dropZone");
    dropZone.append(cardElement);

    checkForCardInSocket();
}

function addCardBackToHand(ev){

    ev.preventDefault();

    //----Gets the id of the dragged element----//
    var data = ev.dataTransfer.getData("text");
    var cardElement = document.getElementById(data);

    let dropZone = ev.target.closest(".dropZone");
    dropZone.append(cardElement);

    checkForCardInSocket();

}

function addCardBackToSocket(ev){
    var data = ev.dataTransfer.getData("text");

    var cardElement = document.getElementById(data);
    var cardSocket = document.getElementById("userCardSocket");

    // Check if the socket already contains a card
    if (cardSocket.querySelector(".card")) {
        var existingCard = cardSocket.querySelector(".card");
        cardSocket.removeChild(existingCard);
        $("#cardHand").append(existingCard);
    }
    $("#userCardSocket").append(cardElement);

    checkForCardInSocket();
}

function checkForCardInSocket(){
    console.log("- - - check if lockButton works")
    var cardSocket1 = document.getElementById("userCardSocket");
    var lockButton = document.getElementById("userLockCardButton");

    if (cardSocket1.querySelector(".card")) {
        lockButton.disabled = false;
    }else{
        lockButton.disabled = true;
    }
}


function createDivCards(cardList){
    let tempList = []
    for (let i = 0; i < cardList.length; i++){
        let card = cardList[i]

        let divCard = drawCard(card)
        
        tempList.push(divCard)
    }
    return tempList;
}
function drawCard(card){
    switch (card["cardClass"]){
        case "paper":
            attackImg = "../static/images/heart.jpg"
            defenseImg = "../static/images/shield.jpg"
            break;
        case "scissors":
            attackImg = "../static/images/scissors.jpg"
            defenseImg = "../static/images/shield.jpg"
            break;
        case "rock":
            attackImg = "../static/images/sword.jpg"
            defenseImg = "../static/images/fist.jpg"
            break;
    }
    return (`
        <div class="card `+card['cardClass']+`Col" owned="`+ card['owned'] +`" ondrop="event.preventDefault();" draggable="true" ondragstart="drag(event)" id="`+card['id']+`">
            <h3 class="cardTitle `+card['cardClass']+`Col" draggable="false">
                `+card['name']+`
            </h3>
            <div class="imageContainer">
              <img class="`+card['cardClass']+`Col cardIcon" src="`+card['imgId']+`" alt="`+card['name']+`" draggable="false">
            </div>
            <div class="row align-items-center stats" draggable="false">
              <b class="statBorder col `+card['cardClass']+`Col">  
                <h5>
                  <img class="shieldSwordLogo" src="`+attackImg+`" draggable="false">
                  `+card['ATK']+` 
                </h5>
              </b>
              <b class="statBorder col `+card['cardClass']+`Col">  
                <h5>
                  <img class="shieldSwordLogo" src="`+defenseImg+`" draggable="false"> 
                  `+card['DEF']+` 
                </h5>
              </b>
            </div>
            <h6 class="cardClass `+card['cardClass']+`TextCol" draggable="false"> 
              (`+card['cardClass']+`)
            </h6>
            <h6 class="cardDesc" draggable="false"> `+card['desc']+`</h6>
        </div>`)
}