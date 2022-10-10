"use strict"

let W = 31;
let H = 31;
let ctx;			//グラフィックコンテキスト
let keyCode = 0;	//現在どのキーが押されているか
let maze = [];		//迷路を保持する2次元配列
let player;			//主人公オブジェクト
let aliens = [];	//敵オブジェクトを含む配列
let timer = NaN;	//タイマー
let status = 0;		//ゲームの状態：クリア = 1、ゲームオーバー = 2
let GAMECLEAR = 1;
let GAMEOVER = 2;

//スクロールするオブジェクト
let scroller = new Scroller();
//プロトタイプ
Player.prototype = scroller;
Alien.prototype = scroller;

//スクロール処理オブジェクト
function Scroller() {
	//スクロール用カウンタscrollCountを増加させる
	this.doScroll = function () {
		if (this.dx == 0 && this.dy == 0) {
			return;
		}
		//カウンタが5以上になった場合
		if (++this.scrollCount >= 5) {
			//1コマ移動させるので自分の座標(x, y)に(dx, dy)を加える
			this.x = this.x + this.dx;
			this.y = this.y + this.dy;
			this.dx = 0;
			this.dy = 0;
			this.scrollCount = 0;
		}
	}
	//現在のx座標を返す
	this.getScrollX = function() {
		//1マス50ピクセル分のため座標は「this.x * 50」
		//さらにカウンタが5で1マス、すなわちカウンタ1で10ピクセル分の移動になる
		return this.x * 50 + this.dx * this.scrollCount * 10;
	}
	//現在のy座標を返す
	this.getScrollY = function() {
		//1マス50ピクセル分のため座標は「this.y * 50」
		//さらにカウンタが5で1マス、すなわちカウンタ1で10ピクセル分の移動になる
		return this.y * 50 + this.dy * this.scrollCount * 10;
	}
}

//主人公オブジェクトコンストラクタ
function Player(x, y) {

	//初期化
	this.x = x;
	this.y = y;
	this.dx = 0;
	this.dy = 0;
	this.dir = 0;
	this.scrollCount = 0;

	this.update = function() {
		//scrollbarオブジェクトのカウンタscrollCountを増やす
		this.doScroll();
		//0より大きい場合はスクロール中のため以降の処理は行わない
		if (this.scrollCount > 0) {
			return;
		}
		//迷路右下に到着したためゴールとする
		if (this.x == W - 2 && this.y == W - 2) {
			clearInterval(timer);
			status = GAMECLEAR;
			document.getElementById("bgm").pause();
			repaint();
		}
		this.dx = 0;
		this.dy = 0;
		let nx = 0;
		let ny = 0;
		//keyCodeの値に応じて(nx, ny)とdirの値を更新する
		switch (keyCode) {
			case 37:
				nx = -1;
				ny = 0;
				this.dir = 2;
				break;
			case 38:
				nx = 0;
				ny = -1;
				this.dir = 0;
				break;
			case 39:
				nx = +1;
				ny = 0;
				this.dir = 3;
				break;
			case 40:
				nx = 0;
				ny = +1;
				this.dir = 1;
				break;
		}
		//移動先の場所が通路のため、(dx, dy)を更新する
		if (maze[this.y + ny][this.x + nx] == 0) {
			this.dx = nx;
			this.dy = ny;
		}
	}

	//主人公のimgオブジェクトを取得し、座標(x, y)に大きさ(w, h)で描画する
	this.paint = function(gc, x, y, w, h) {
		let img = document.getElementById("hero" + this.dir);
		gc.drawImage(img, x, y, w, h);
	}
}

//敵コンストラクタオブジェクト
function Alien(x, y) {

	//初期化
	this.x = x;
	this.y = y;
	this.dx = 0;
	this.dy = 0;
	this.dir = 0;
	this.scrollCount = 0;

	this.update = function() {
		//scrollbarオブジェクトのカウンタscrollCountを増やす
		this.doScroll();
		//主人公キャラクタとの衝突判定
		let diffX = Math.abs(player.getScrollX() - this.getScrollX());
		let diffY = Math.abs(player.getScrollY() - this.getScrollY());
		//x方向の差分とy方向の差分がともに40以下になったときに衝突としてゲームオーバーの処理を行う
		if (diffX <= 40 && diffY <= 40) {
			clearInterval(timer);
			status = GAMEOVER;
			document.getElementById("bgm").pause();
			repaint();
		}
		//主人公の座標から敵の座標を引いた値
		let gapx = player.x - this.x;
		let gapy = player.y - this.y;
		//徐々に主人公に近づくようにAlienの移動先を求める
		switch (random(4)) {
			//gapxが正の場合、主人公が右にいることになるため、移動方向dxを1とする
			case 0:
				this.dx = gapx > 0 ? 1 : -1;
				this.dir = (this.dx == 37) ? 2 : 3;
				break;
			case 1:
				this.dy = gapy > 0 ? 1 : -1;
				this.dir = (this.dy == 38) ? 0 : 1;
				break;
			default:
				this.dx = 0;
				this.dy = 0;
				break;
		}
	}
	this.paint = function(gc, w, h) {
		let img = document.getElementById("alien" + this.dir);
		gc.drawImage(img, this.getScrollX(), this.getScrollY(), w, h);
	}
}

function random(v) {
	return Math.floor(Math.random() * v);
}

function init() {
	let maze = document.getElementById("maze");
	//canvasのコンテキストを設定
	ctx = maze.getContext("2d");
	ctx.font = "bold 48px sans-serif";
	//迷路データを作成
	createMaze(W, H);
	//主人公オブジェクトの作成
	player = new Player(1, 1);
	//敵オブジェクトの作成
	aliens = [new Alien(W - 2, 1), new Alien(1, W - 2)];
	repaint();
}

//キー、マウス、タッチ用のイベントハンドラを登録
function go() {
	window.onkeydown = mykeydown;
	window.onkeyup = mykeyup;

	let maze = document.getElementById("maze");
	maze.onmousedown = mymousedown;
	maze.onmouseup = mykeyup;
	//タッチの長押しによってコンテキストメニューが表示される挙動を防止する
	maze.oncontextmenu = function(e) {
		e.preventDefault();
	};
	maze.addEventListener('touchstart', mymousedown);
	maze.addEventListener('touchend', mykeyup);
	//メインループのtickを開始
	timer = setInterval(tick, 45);
	//STARTボタンを非表示にする
	document.getElementById("START").style.display = "none";
	//BGMの再生を開始
	document.getElementById("bgm").play();
}

//メインルーチン
function tick() {
	player.update();
	for (let i = 0; i < aliens.length; i++) {
		aliens[i].update();
	}
	repaint();
}

//幅:w、高さ:hの迷路生成
function createMaze(w, h) {
	for (let y = 0; y < h; y++) {
		maze[y] = [];
		for (let x = 0; x < w; x++) {
			maze[y][x] = (x == 0 || x == w - 1 || y == 0 || y == h - 1) ? 1 : 0;
		}
	}
	for (let y = 2; y < h - 2; y += 2) {
		for (let x = 2; x < w - 2; x += 2) {
			maze[y][x] = 1;
			//最上段は上下左右、それ以外は下左右
			let dir = random((y == 2) ? 4 : 3);
			let px = x;
			let py = y;
			switch (dir) {
				case 0:
					py++;
					break;
				case 1:
					px--;
					break;
				case 2:
					px++;
					break;
				case 3:
					py--;
					break;
			}
			maze[py][px] = 1;
		}
	}
}

//円をcanvasに描画
function drawCircle(x, y, r, color) {
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI * 2);
	ctx.fill();
}

//描画
function repaint() {
	//背景クリア
	ctx.fillStyle= "black";
	ctx.fillRect(0, 0, 900, 600);

	//コンテキスト保存
	ctx.save();
	ctx.beginPath();
	//円を描画
	ctx.arc(300, 300, 300, 0, Math.PI * 2);
	//クリップ領域設定
	ctx.clip();

	//迷路描画
	ctx.fillStyle = "brown";
	//迷路を主人公と反対に動かすことでスクロール効果を演出
	ctx.translate(6 * 50, 6 * 50);
	ctx.translate(-1 * player.getScrollX(), -1 * player.getScrollY());
	//壁を茶色で塗りつぶす
	for (let x = 0; x < W; x++) {
		for (let y = 0; y < H; y++) {
			if (maze[y][x] == 1) {
				ctx.fillRect(x * 50, y * 50, 50, 50);
			}
		}
	}
	//敵キャラクタの描画
	for (let i = 0; i < aliens.length; i ++) {
		aliens[i].paint(ctx, 50, 50);
	}
	ctx.restore();
	//地図描写
	ctx.fillStyle = "#eeeeee";
	ctx.fillRect(650, 0, 250, 600);
	ctx.save();
	ctx.translate(670, 300);
	ctx.fillStyle = "brown";
	for (let x = 0; x < W; x++) {
		for (let y = 0; y < H; y++) {
			if(maze[y][x] == 1) {
				ctx.fillRect(x * 7, y * 7, 7, 7);
			}
		}
	}
	drawCircle(player.x * 7 + 3, player.y * 7 + 3, 3, "red");
	for (let i = 0; i < aliens.length; i++) {
		drawCircle(aliens[i].x * 7 + 3, aliens[i].y * 7 + 3, 3, "purple");
	}
	ctx.restore();

	//コントローラ描画
	ctx.drawImage(arrows, 670, 70, 200, 200);
	let ax = -100;
	let ay = -100;
	switch (keyCode) {
		case 37:
			ax = 710;
			ay = 170;
			break;
		case 38:
			ax = 770;
			ay = 120;
			break;
		case 39:
			ax = 830;
			ay = 170;
			break;
		case 40:
			ax = 770;
			ay = 230;
			break;
	}
	drawCircle(ax, ay, 30, "yellow");
	//主人公描画とメッセージ
	player.paint(ctx, 300, 300, 50, 50);
	ctx.fillStyle = "yellow";
	if (status == GAMEOVER) {
		ctx.fillText("GAME OVER", 150, 200);
	}
	else if (status == GAMECLEAR) {
		ctx.fillText("GAME CLEAR", 150, 200);
	}
}

//キー押下のイベントハンドラ
function mykeydown(e) {
	keyCode = e.keyCode;
}

function mykeyup(e) {
	keyCode = 0;
}

//マウス押下のイベントハンドラ
function mymousedown(e) {
	//マウスがクリックされている場合はe.offsetに数値が格納されるため、
	//「!isNaN(e.offset)」がtrueになり、e.offsetの値がmouseに設定される
	//数値でない場合はe.touches[0].clientでタッチ座標を設定
	let mouseX = !isNaN(e.offsetX) ? e.offsetX : e.touches[0].clientX;
	let mouseY = !isNaN(e.offsetY) ? e.offsetY : e.touches[0].clientY;
	//どのボタンの上で押されたのかの判定
	if (670 < mouseX && mouseX < 870 && 70 < mouseY && mouseY < 270) {
		mouseX -= 770;
		mouseY -= 170;
		if (Math.abs(mouseX) > Math.abs(mouseY)) {
			//左右ボタンの判定
			keyCode = mouseX < 0 ? 37 : 39;
		}
		else {
			//上下ボタンの判定
			keyCode = mouseX < 0 ? 38 : 40;
		}
	}
}