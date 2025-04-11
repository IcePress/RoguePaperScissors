chooseCardDiv(false);

//Här togglas mainMenuDiv mellan att gömmas och visas då spelet börjar eller slutar
function mainMenuDiv(bool){
    if (bool){
        $("#theMainMenuDiv").show()
        $("#theInGameDiv").hide()
        console.log("- Enabling the main menu div")
    }else{
        $("#theMainMenuDiv").hide()
        $("#theInGameDiv").show()
        console.log("- Disabling the main menu div")
    }
}

//Här togglas chooseCardDiv mellan att gömmas och visas, då tre rundor har gått och spelare väljer nya kort
function chooseCardDiv(bool){
    if (bool){
        $("#theInGameChooseCardDiv").show()
        $("#theInGameRoundDiv").hide()
        console.log("- Enabling the choose card div")

    }else{
        $("#theInGameChooseCardDiv").hide()
        $("#theInGameRoundDiv").show()
        console.log("- Disabling the choose card div")
    }
}

//Logga in funktion: Hittar username och password, och kollar så att de båda är ifyllda innan de skickas till routes
function loginUser(){
    let username = document.getElementById("formUsername").value;
    let password = document.getElementById("formPassword").value;
    
    if (username.length > 0 && password.length > 0){
        

        if (username && password){
            console.log(username)
            console.log(password)

            data = {
                "username": username,
                "password": password
            }

            $.ajax({
                type: "POST",
                url: "/login",
                data: JSON.stringify(data),
                dataType: "json",
                contentType: "application/json",
                success: function (response) {
                    console.log(response)
                    
                    //om man lyckas logga in så ser du ditt användarnamn i hörnet
                    if (response['loggedIn']){
                        jsUserData['userSes'] = response['user']
                        document.getElementById("accountSquare").innerHTML = `
                            <section class="border p-2 fixed-top account_section">
                                <section class="p-2">
                                    <h3>
                                        `+jsUserData['userSes']['username']+`
                                    </h3>
                                </section>
                                <div class="container-fluid d-flex full-height">
                                    <section class="border p-4 mx-auto">
                                        <button onclick="logoutUser()" value="Log out">
                                            <h5>
                                                Log out
                                            </h5>
                                        </button>
                                    </section>
                                </div>
                            </section>
                        `;
                    }
                }
            });
        }
    } else if (!username > 0){
        document.getElementById("formUsername").value = "Missing username";
    } else {
        document.getElementById("formUsername").value = "Missing password";
    }
}

//logga ut funktion.
function logoutUser(){
    $.ajax({
        type: "GET",
        url: "/logout",
        data: null,
        dataType: "json",
        contentType: "application/json",
        success: function (response) {
            
            document.getElementById("accountSquare").innerHTML = `
                <section class="p-2 fixed-top account_section container-fluid d-flex align-items-center full-height">
                <section class="border p-4">
                    <h2>
                    Log in
                    </h2>
                <table>
                    <tr>
                    <td>Username:</td>
                    <td><input type="text" id="formUsername"></td>
                    </tr>
                    <tr>
                    <td>Password:</td>
                    <td><input type="password" id="formPassword"></td>
                    </tr>
                    <tr>
                    <td colspan="2">
                        <button onclick="loginUser()" value="Log in">
                        <h5>
                            Log in
                        </h5>
                        </button>
                    </td>
                    </tr>
                </table>
                <section class="container-fluid d-flex align-items-center">
                    <button onclick="createAccountSection()" class="border p-4 mx-auto">
                        <h5>
                            Register account
                        </h5>
                    </button>
                </section>
                </section>
                </section>
            `;
        }
    });

}

//Här skapas "skapa konto" rutan där användaren kan fylla i uppgifter för att registrera sig.
function createAccountSection(){
            
    document.getElementById("accountSquare").innerHTML = `
        <section class="p-2 fixed-top account_section container-fluid d-flex align-items-center full-height">
                <section class="border p-4">
                    <h2>
                        Register Account
                    </h2>
                    <table>
                        <tr>
                            <td>Username:</td>
                            <td><input type="text" id="createUsername"></td>
                        </tr>
                        <tr>
                            <td>Password:</td>
                            <td><input type="password" id="createPassword1"></td>
                        </tr>
                        <tr>
                            <td>Repeat Password:</td>
                            <td><input type="password" id="createPassword2"></td>
                        </tr>
                    </table>
                    <button onclick="createAccount()">
                        <h5>
                            Register
                        </h5>
                    </button>
                </section>
            </section>
    `;
}

//Registrera konto funktion: och loggar även in användaren
function createAccount(){
    let username = document.getElementById("createUsername").value;
    let password1 = document.getElementById("createPassword1").value;
    let password2 = document.getElementById("createPassword2").value;

    if (username && password1 && password2){
        console.log(username)
        console.log(password1)

        data = {
            "username": username,
            "password1": password1,
            "password2": password2
        }

        $.ajax({
            type: "POST",
            url: "/createaccount",
            data: JSON.stringify(data),
            dataType: "json",
            contentType: "application/json",
            success: function (response) {
                console.log(response)
                
                data2 = {
                    "username": username,
                    "password": password1
                }
            
                $.ajax({
                    type: "POST",
                    url: "/login",
                    data: JSON.stringify(data2),
                    dataType: "json",
                    contentType: "application/json",
                    success: function (response2) {
                        console.log(response2)
                        
                        if (response2['loggedIn']){
                            document.getElementById("accountSquare").innerHTML = `
                                <section class="border p-2 fixed-top account_section">
                                    <section class="p-2">
                                        <h3>
                                            `+response2['user']['username']+`
                                        </h3>
                                    </section>
                                    <div class="container-fluid d-flex full-height">
                                        <section class="border p-4 mx-auto">
                                            <button onclick="logoutUser()" value="Log out">
                                                <h5>
                                                    Log out
                                                </h5>
                                            </button>
                                        </section>
                                    </div>
                                </section>
                            `;
                        }
                    }
                });
            }
        });
    }    
}

//När spelet slutas, så ser det till att alla html element och all spelinformation återställs
function breakGame(){

    let userHpBar = document.getElementById("userHPBar");
    let opponentHpBar = document.getElementById("opponentHPBar");

    userHpBar.style.width = "100%"
    opponentHpBar.style.width = "100%"

    cardsLocked = false;
    pickingCard = false;

    room = jsUserData['room']
    gameId = jsUserData['gameId']

    jsUserData = {
        "gameId" : null,
        "game" : null,
        "room" : null,
        "userSid" : null,
        "opponentSid" : null,
        "playerUserNum" : null,
        "playerOpponentNum" : null,
        "cardRoster": []
    }

    mainMenuDiv(true)
    $("#theInGameChooseCardDiv").show()
    $("#theInGameRoundDiv").hide()
    $("#theGameOverDiv").hide()

    socket.emit('leave', {
        "room": room
    });
}

//Dubbel kollar ifall user session finns, endast för debug
$.ajax({
    type: "GET",
    url: "/getUserSession",
    data: JSON.stringify(),
    dataType: "json",
    contentType: "application/json",
    success: function (response) {
        console.log(response)
        jsUserData['userSes'] = response['sesUser']
    }
});


$(document).ready(function () {
    //Skapar nya kort att välja mellan, endast för debug
    $("#ToggleTest").click(function () { 
        console.log(jsUserData['cardRoster'])
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
});

/*function addToHand(userId, card){

    data = {
        "userId": userId,
        "card": card
    }

    $.ajax({
        type: "POST",
        url: "/cardAddToHand",
        data: JSON.stringify(data),
        dataType: "json",
        contentType: "application/json",
        success: function (response) {

        }
    });
}*/

//ifall man hostar ett spel och trycker på "cancel" så tas spelet bort från den globala listan
function cancelGameCode(){

    $("#btnCreateGame").show()
    $("#btnJoinGame").show()

    let element = document.getElementById("createdCodeSectionContent");
    element.remove();
}

//uppdaterar HTML då spelet uppdateras
function updateGameHtml(data){
    console.log("   ((Updating HTML))")
    let game = data['game']
    let playerUser = data['user']
    let playerOpponent = data['opponent']
    
    document.getElementById("userNameTitle").innerHTML = game[playerUser]["name"]
    document.getElementById("userPlayerTitle").innerHTML = playerUser
    document.getElementById("opponentNameTitle").innerHTML = game[playerOpponent]["name"]
    document.getElementById("opponentPlayerTitle").innerHTML = playerOpponent
    document.getElementById("userHPBar").innerHTML = game[playerUser]['HP'] + "/" + game[playerUser]['maxHP'] + " HP"
    document.getElementById("opponentHPBar").innerHTML = game[playerOpponent]['HP'] + "/" + game[playerOpponent]['maxHP'] + " HP"
    document.getElementById("userCardSocketText").innerHTML = game[playerUser]["name"]
    document.getElementById("opponentCardSocketText").innerHTML = game[playerOpponent]["name"]
    document.getElementById("roundInt").innerHTML = game['round'] + " / 3"
    document.getElementById("levelInt").innerHTML = game['level']
    document.getElementById("userPlayerRoundWins").innerHTML = "Advantage: " + game[playerUser]['roundWins']
    document.getElementById("opponentPlayerRoundWins").innerHTML = "Advantage: " + game[playerOpponent]['roundWins']
}
