function damage(targetPlayerCard, attackerPlayerCard, amount) {

  game = jsUserData['game']
  targetIden = "user";
  if (game[jsUserData['playerOpponentNum']]['id'] == game[targetPlayerCard['playerNum']]['id']){
    targetIden = "opponent"
  }
  var target = targetPlayerCard['player']
  let targetHpBarStr = targetIden+"HPBar"
  var targetHpBar = document.getElementById(targetHpBarStr);
  console.log(targetHpBar)
  var currentHP = target["HP"];

  calculateDamage(target, amount);
  
  var newHP = target["HP"];
  var maxHP = target["maxHP"];
  
  var HPBarRollAnim = setInterval(animateHP, 50);

  function animateHP() {
    if (currentHP > newHP) {
      currentHP--; 
      targetHpBar.style.width = hpToPercent(currentHP) + '%'; 
      targetHpBar.innerHTML = Math.ceil((currentHP)) + '/' + maxHP + ' HP';
    }else if (currentHP < newHP) {
      currentHP++; 
      targetHpBar.style.width = hpToPercent(currentHP) + '%'; 
      targetHpBar.innerHTML = Math.ceil((currentHP)) + '/' + maxHP + ' HP';
    }else {
      clearInterval(HPBarRollAnim);
    }
  }

  function calculateDamage(calcTarget, calcAmount){
    if (calcTarget["HP"] - calcAmount < 0){
      calcTarget["HP"] = 0;
    } else if (calcTarget["HP"] - calcAmount > calcTarget["maxHP"]){
      calcTarget["HP"] = calcTarget["maxHP"];
    } else {
      calcTarget["HP"] -= calcAmount;
    }
    let newGame = game
    newGame[targetPlayerCard['playerNum']]['HP'] = calcTarget['HP']

    postData = {
      "game": newGame,
      "gameId": jsUserData['gameId']
    }

    $.ajax({
      type: "POST",
      url: "/updateGame",
      data: JSON.stringify(postData),
      dataType: "json",
      contentType: "application/json",
      success: function (response) {
      }
    });
  }

  function hpToPercent(hp){
    return ((hp / maxHP) * 100)
  }        
}

function cardZoomInAnim(playerCard){
  let userCardSocket = document.getElementById("userCardSocket"); 
  let opponentCardSocket = document.getElementById("opponentCardSocket"); 
  if (userCardSocket.querySelector(".card")) {
    let userDivCard = userCardSocket.querySelector(".card")
    if (playerCard['card']['id'] == userDivCard['id']){
      createAnimation(userDivCard);
      }
  }
  if (opponentCardSocket.querySelector(".card")) {
    let opponentDivCard = opponentCardSocket.querySelector(".card")
    if (playerCard['card']['id'] == opponentDivCard['id']){
      createAnimation(opponentDivCard);
    }
  }
          
  //card win animation
  function createAnimation(divCard) {
    var cardWinAnim = setInterval(animateWinCard, 1);
    let increaseNum = 0.01
    let decreaseNum = 0
    let scaleNum = 1
    let minScale = 1
    function animateWinCard(){
      if (scaleNum >= minScale){
        decreaseNum += 0.0002
        scaleNum += (increaseNum - decreaseNum);
        divCard.style.transform = "scale("+scaleNum+", "+scaleNum+")"
      }else{
        clearInterval(cardWinAnim)
      }
    }
  }  
}

function discardCards(){
  $.ajax({
    type: "POST",
    url: "/getGameData",
    data: JSON.stringify(jsUserData),
    dataType: "json",
    contentType: "application/json",
    success: function (response) {
      let game = response['game']
      let user = response['user']
      let opponent = response['opponent']

      console.log("trying to remove from game session")
      $.ajax({
        type: "POST",
        url: "/emptyGameCardSlots",
        data: JSON.stringify(jsUserData['gameId']),
        dataType: "json",
        contentType: "application/json",
        success: function (response) {
          let userCardSocket = document.getElementById("userCardSocket"); 
          userCardSocket.innerHTML = '';
          let opponentCardSocket = document.getElementById("opponentCardSocket"); 
          opponentCardSocket.innerHTML = '';
          //startNewRound()
          
        }
      });
    }
  });
}


