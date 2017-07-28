'use strict'; /*jslint node:true*/

//Находим на карте объекты определенного типа
function find_targets(target_types, screen){   
	var diamonds = [];
	for (let x = 0; x<screen_height; x++)
    {		
        let row = screen[x];        
        for (let y = 0; y<row.length; y++)
        {
          if (target_types.includes(screen[x][y])){
            diamonds.push({x, y});           
          }
          // else if (find_butts){
          //   if ('/-\\'.includes(screen[x][y])){
          //     if (is_closed_butt(screen, x, y, [])){
          //       diamonds.push({x, y});
          //     }
          //   }
          // }
        }		
    }  
	return diamonds;
};

//Ищем путь, чтобы убить бабочку камнем
function get_path_to_kill_butt(butts, screen, graph, self){
  //Находим ближайшую бабочку
  var min_dist = 999999;
  var closest_butt = undefined;
  butts.forEach(function(butt) {
    var dist = get_manhatten_dist(self.x, self.y, butt.x, butt.y);
    if (dist < min_dist){
      min_dist = dist;
      closest_butt = butt; 
    }
  }, this);

  //если все бабочки убиты, выходим
  if (closest_butt == undefined) return undefined;

  //смотрим все точки земли выше бабочки (':'). съедаем ближашую к себе землю
  var x = closest_butt.x - 1;
  var y = closest_butt.y;
  var butt_kill_path = undefined;
  var min_path_length = 999999;
  while (x > 0){
    if (screen[x][y]== ':'){
      var end = graph.grid[x][y];
      var path = astar.search(graph, self, end);  
      if (path.length > 0 && path.length < min_path_length){       
        butt_kill_path = path;      
        min_path_length = path.length;  
      }      
    }
    x--;      
  }

  return butt_kill_path;
}

function get_vector_length(v){
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

function get_vectors_angle(a, b){
  var cosFi = (a.x * b.x + a.y + b.y) / get_vector_length(a) / get_vector_length(b);
  var fi = Math.acos(cosFi);
  return fi;
}

//Ищем ближаший возможный путь от стартовой точки до 1 из целей
function get_shortest_path(start, targets, graph, use_delone){ 
  //Просто ближайшая точка
	var min_dist = 999999;
  var shortest_path = undefined;  

	for (let i = 0; i < targets.length; i++)
	{
    var target = targets[i];
    if (graph.grid[target.x][target.y].weight == 0) continue;

    var end = graph.grid[target.x][target.y];
    var path = astar.search(graph, start, end);  

		if (path.length > 0 && path.length < min_dist)
		{			
			min_dist = path.length;
			shortest_path = path;
		}
  }

  return shortest_path;	
    
};

function init_graph(screen, self, is_butt_graph)
{
  var arr = []; 
	for (let x = 0; x<screen_height; x++)
    {
		var arrRow = [];
    let row = screen[x];
    for (let y = 0; y<row.length; y++)
    {
      if ('A *|/-\\'.includes(screen[x][y]))        
        arrRow.push(1);        
      else if ('+#'.includes(screen[x][y])){           
        arrRow.push(0);
      }
      else if ('O'.includes(screen[x][y])){  
        
        if (is_butt_graph){
          arrRow.push(0);
        }
        else{
          arrRow.push(0);
          //определяем потенциально подвижный камень          
          // var canMoveLeft = self.x == x && self.y - y == 1 &&
          //   y > 0 && screen[x][y-1] == ' ';
        
          // var canMoveRight = self.x == x && self.y - y == -1 && 
          //   y < screen[x].length-1 && screen[x][y+1] == ' ';
        
          // arrRow.push(canMoveLeft || canMoveRight ? 1 : 0);        
          
          
          
        }       
      }  
      else if (':'.includes(screen[x][y])){
        arrRow.push(is_butt_graph ? 0 : 1);
      }
      else {     
        console.log("Unknown symbol");
        throw "Unknown symbol";
      }
      
    }
		arr.push(arrRow);
	}
	return new Graph(arr);
}


function set_movable_stones_weight(screen, self, graph){
  	for (let x = 0; x<screen_height; x++)    {		
      let row = screen[x];
      for (let y = 0; y<row.length; y++)    {
        if (screen[x][y]=='O'){
          graph.grid[x][y].weight = 1;
          var is_ok_stone = false;
          var start = graph.grid[self.x][self.y];
          var end = graph.grid[x][y];
          var path = astar.search(graph, start, end);
          if (path.length > 0){
            var penultimate_x = path.length == 1 ? self.x : path[path.length - 2].x;
            var penultimate_y = path.length == 1 ? self.y : path[path.length - 2].y;
            if (penultimate_y < y && screen[x][y+1]==' '){
              is_ok_stone = true;
            }
            else if (penultimate_y > y && screen[x][y-1]==' '){
              is_ok_stone = true;
            }
          }
          if (!is_ok_stone){
            graph.grid[x][y].weight = 0;
          }
        }
      }
    }
}

//метод назначает нулевые веса точкам, которые в опасной близости от бабочек
function afraid_of_butterfly(screen, graph, self, butts, butt_graph){   
  for (let i = 0; i < butts.length; ++i){     
    set_butt_weights2(screen, graph, butts[i], self, butt_graph);
  }
}

function set_butt_weights2(screen, graph, butt, self, butt_graph){

  var x = butt.x;
  var y = butt.y;

  if (!is_closed_butt(butt)){
    graph.grid[x][y].weight = 0; //сама бабочка непроходима, если она уже открыта
  } 

  if (get_manhatten_dist(self.x, self.y, x, y) == 1){//если рядом с бабочком, все сос. точки проходимы
    return;
  }

  //Помечаем непроходимыми те точки около себя, до которых бабочка может дойти за 2 шага 
  var start = butt_graph.grid[x][y];
 
    butt_graph.grid[self.x-1][self.y].weight = 1;
    var up_path = astar.search(butt_graph, start, butt_graph.grid[self.x-1][self.y]);
    //console.log("\n" + up_path.length);     
    
    if (up_path.length > 0 && up_path.length <= 2){
      graph.grid[self.x - 1][self.y].weight = 0;      
    }
  

  butt_graph.grid[self.x+1][self.y].weight = 1;
    var down_path = astar.search(butt_graph, start, butt_graph.grid[self.x+1][self.y]);
    if (down_path.length > 0 && down_path.length <= 2){    
      graph.grid[self.x + 1][self.y].weight = 0;        
    }
  
   
  butt_graph.grid[self.x][self.y-1].weight = 1;
    var left_path = astar.search(butt_graph, start, butt_graph.grid[self.x][self.y-1]);
    if (left_path.length > 0 && left_path.length <= 2){    
      graph.grid[self.x][self.y - 1].weight = 0;        
    }
  
  
  butt_graph.grid[self.x][self.y+1].weight = 1;
    var right_path = astar.search(butt_graph, start, butt_graph.grid[self.x][self.y+1]);
    if (right_path.length > 0 && right_path.length <= 2){    
      graph.grid[self.x][self.y + 1].weight = 0;        
    }
  
   
}

function get_manhatten_dist(x1, y1, x2, y2){
  return Math.abs(x1 - x2) + Math.abs(y1-y2);
}

function get_nearest_corner(self_x, self_y, screen){
  if (self_x < screen_height / 2){
    return self_y < screen[self_x].length / 2 ? CORNER_TYPE.LT : CORNER_TYPE.RT;
  }
  else {
    return self_y < screen[self_x].length / 2 ? CORNER_TYPE.LD : CORNER_TYPE.RD;
  }
}

function check_closed_butts(screen){ 
  for (var i = close_butts.length - 1; i >= 0; --i){
    if (!is_closed_butt_tmp(screen, close_butts[i].x, close_butts[i].y, [])){
      close_butts.splice(i, 1);
    }
  }  
}

function is_closed_butt(butt){
  return close_butts.findIndex(b => b.x == butt.x && b.y == butt.y) > -1;
}

//закрыта ли бабочка в своей берлоге
function is_closed_butt_tmp(screen, x, y, checked_cells)
{
  checked_cells.push({x, y});

  if ('A'.includes(screen[x][y])) return false;
  if ('*:+#O'.includes(screen[x][y])) return true;
  
  //иначе пустая ячейка
  var is_closed = true;

  var new_x = x;
  var new_y = y-1;

  var index = checked_cells.findIndex(p => p.x == new_x && p.y == new_y);
  
  if (index == -1){ //еще не проверяли
    is_closed = is_closed &&  is_closed_butt_tmp(screen, new_x, new_y, checked_cells);    
  }

  new_x = x;
  new_y = y+1;
  index = checked_cells.findIndex(p => p.x == new_x && p.y == new_y);
  if (index == -1){ //еще не проверяли
    is_closed = is_closed &&  is_closed_butt_tmp(screen, new_x, new_y, checked_cells);    
  }

  new_x = x-1;
  new_y = y;
  index = checked_cells.findIndex(p => p.x == new_x && p.y == new_y);
  if (index == -1){ //еще не проверяли
    is_closed = is_closed &&  is_closed_butt_tmp(screen, new_x, new_y, checked_cells);    
  }

  new_x = x+1;
  new_y = y;
  index = checked_cells.findIndex(p => p.x == new_x && p.y == new_y);
  if (index == -1){ //еще не проверяли
    is_closed = is_closed &&  is_closed_butt_tmp(screen, new_x, new_y, checked_cells);    
  }

  return is_closed;
 
}

//метод ищет падающие камни и алмазы. помечает соотвествующие точки непроходимыми
function afraid_of_stones_and_diamonds(screen, graph, self_x, self_y){ 

  //определяем координаты камней на данном шаге
  var new_stones = [];
  for (let x = 0; x<screen_height; x++)
  {	
    let row = screen[x];
    for (let y = 0; y<row.length; y++)
    {
      if ('O*'.includes(screen[x][y]))         
        new_stones.push({x,y});
    }
  }

  // if (stones.length == 0) {
  //   stones = new_stones;
  //   return;
  // }
      
  //ищем падающие камни
  var falling_stones = [];
  for (var i = 0; i < new_stones.length; ++i){

    var x = new_stones[i].x;
    var y = new_stones[i].y;

    var isFalling = false;

    //под ним пусто. упадет на этот ход    
    if (screen[x+1][y]==' '){  
      graph.grid[x+1][y].weight = 0;    
      if(x < screen_height - 2 && screen[x+2][y] != 'A'){        
        graph.grid[x+2][y].weight = 0;    
      }   
      isFalling = true;   
    }   

    var isDangerousBottom = screen[x+1][y] =='+' || screen[x+1][y] =='O' || screen[x+1][y] =='*';

    //падает влево
    if (isDangerousBottom && x < screen_height - 1 && y > 0 && 
      screen[x][y-1]==' ' && screen[x+1][y-1]==' ' && screen[x+1][y] != ' ' && screen[x+1][y] != 'A'){
        graph.grid[x+1][y-1].weight = 0;   
        isFalling = true;           
    }
    //падает вправо
    if (isDangerousBottom && x < screen_height - 1 && y < screen[x].length - 1 && 
      screen[x][y+1]==' ' && screen[x+1][y+1]==' ' && screen[x+1][y] != ' ' && screen[x+1][y] != 'A'){
        graph.grid[x+1][y+1].weight = 0;  
        isFalling = true;          
    }    

    if (stones.length == 0) continue; //1 ход

    //падал на прошлом ходу
    var isStableStone = false;
    for (var j = 0; j < stones.length; ++j){
      if (stones[j].x == new_stones[i].x && stones[j].y == new_stones[i].y){
        isStableStone = true;
        break;
      }
    }
    if (!isStableStone){
      falling_stones.push(new_stones[i]);
    }         

  } 

  //я стою точно под подающим камнем. вверх идти нельзя
  for (var i = 0; i < falling_stones.length; ++i){
    var x = falling_stones[i].x;
    var y = falling_stones[i].y;

    if (x == screen_height - 1) continue;
     
    if (screen[x+1][y]=='A'){ 
      graph.grid[x][y].weight = 0; 
    }
  }

  stones = new_stones; 
}

function set_trap_diamonds(diamonds, screen, graph){
  for (var i = 0; i < diamonds.length; ++i){
    var diamond = diamonds[i];
    if (is_trap(diamond, screen)){
      graph.grid[diamond.x][diamond.y].weight = 0;
    }
  }
}

function is_trap(diamond, screen){
  var x = diamond.x;
  var y = diamond.y;

  if (x <= 1) return false;
  if (!' *:A'.includes(screen[x-1][y])) return false;

  x -=2;
  y = y;

  while (true){
    if (' '.includes(screen[x][y])){
      x--;
    }
    else if ('*O'.includes(screen[x][y])){
      break;
    }
    else {
      return false;
    }
  }

  x = diamond.x;
  y = diamond.y;

  while (' *:'.includes(screen[x][y])){
    if (' :A'.includes(screen[x][y-1])) return false;
    if ('O'.includes(screen[x][y-1]) && y >= 2 && ' A'.includes(screen[x][y-2])) return false;

    if (' :A'.includes(screen[x][y+1])) return false; 
    if ('O'.includes(screen[x][y+1]) && y <= screen[x].length - 3 && ' A'.includes(screen[x][y+2])) return false;
    
    x++;
  }

  return true;
}

function is_new_ok_targets(targets, graph, start){
  var is_new=false;
  targets.forEach(function(target) {
    if (graph.grid[target.x][target.y].weight == 0) return;
    var end = graph.grid[target.x][target.y];
    var path = astar.search(graph, start, end);
    if (path.length == 0) return;

    var index = ok_targets.findIndex(p => p.x == target.x && p.y == target.y);
    if (index == -1){
      is_new = true;      
    }    
  }, this);  
  return is_new;
}

function build_tsp_way(targets, self, graph, screen){
  points = [];
  ok_targets =[];
  var start = graph.grid[self.x][self.y];

  
  targets.forEach(function(target) {
    if (graph.grid[target.x][target.y].weight == 0) return;
    var end = graph.grid[target.x][target.y];
    var path = astar.search(graph, start, end);
    if (path.length == 0) return;

    ok_targets.push(target);
    points.push(new Point(target.x, target.y));
  }, this);  

  if (points.length == 0) return undefined;
  if (points.length == 1){
    var end = graph.grid[ok_targets[0].x][ok_targets[0].y];   
    return astar.search(graph, start, end);
  }

  ok_targets.push(self);
  points.push(new Point(self.x, self.y));
  
  GAInitialize();
  running = true;
  draw();

  var self_index = best.indexOf(points.length - 1);
 
  calc_tps_direction(self_index, self, graph);
  
  if (is_forward_tsp){
    tsp_index = self_index < ok_targets.length - 1 ? self_index + 1 : 0;
  }
  else{
    tsp_index = self_index > 0 ? self_index - 1 : ok_targets.length - 1;
  }


  var diamond = ok_targets[best[tsp_index]];   
  var end = graph.grid[diamond.x][diamond.y]; 
  var shortest_path = astar.search(graph, start, end);
  return shortest_path;
}

function calc_tps_direction(self_index, self, graph){
  var start = graph.grid[self.x][self.y];

  var next_target = self_index < best.length - 1 ? ok_targets[best[self_index + 1]] : ok_targets[0];
  var prev_target = self_index > 0 ? ok_targets[best[self_index - 1]] : ok_targets[best[best.length - 1]];

  var next_end = graph.grid[next_target.x][next_target.y];
  var next_path = astar.search(graph, start, next_end);
  
  var prev_end = graph.grid[prev_target.x][prev_target.y];
  var prev_path = astar.search(graph, start, prev_end);
  is_forward_tsp = next_path.length < prev_path.length;
}

function get_path(new_diamonds, self, screen, graph){

  var shortest_path = undefined;
  var start = graph.grid[self.x][self.y];
  if (new_diamonds.length == 0 || new_diamonds.length > all_diamonds.length) {
    //console.log("\nNEW DIAMONDS OR NO DIAMONDS!!!!");
    all_diamonds = new_diamonds;      
    
    initData();  
    shortest_path = build_tsp_way(new_diamonds, self, graph, screen);
    return shortest_path;
  }
 

  var all_diamonds_are_stable = true;
   for (var i = 0; i < new_diamonds.length; ++i){
    var x = new_diamonds[i].x;
    var y = new_diamonds[i].y;
    var no_new_diamond = true;
    for (var j = 0; j < all_diamonds.length; ++j){
      if (all_diamonds[j].x == new_diamonds[i].x && all_diamonds[j].y == new_diamonds[i].y){
        no_new_diamond = false;
        break;
      }
    }
    if (no_new_diamond){
      all_diamonds_are_stable = false;
      break;
    }         
  } 

  if (!all_diamonds_are_stable){
    //console.log("\nUPDATE TSP!!!!");
    initData();
    shortest_path = build_tsp_way(new_diamonds,self, graph,screen);   
  } 
  else if (is_new_ok_targets(new_diamonds, graph, start)){
    //console.log("\nNEW TARGETS!!!!");
    initData();
    shortest_path = build_tsp_way(new_diamonds,self, graph,screen);   
  } 
  else if (new_diamonds.length < all_diamonds.length){     

    var diamond = ok_targets[best[tsp_index]];   
    var is_planed = self.x == diamond.x && self.y == diamond.y;

    if (is_planed){
      //console.log("\nLESS DIAMONDS - PLANED!!!!");        
    }
    else{
     // console.log("\nLESS DIAMONDS - RANDOM!!!!");   
      var random_diamond_index = ok_targets.findIndex(p => p.x == diamond.x && p.y == diamond.y);
      tsp_index = best.indexOf(random_diamond_index);

      calc_tps_direction(tsp_index, self, graph);      
    }

    if (is_forward_tsp){   
      tsp_index = tsp_index < best.length - 1 ? tsp_index + 1 : 0;   
    }
    else{
      tsp_index = tsp_index > 0 ? tsp_index - 1 : best.length - 1;   
    }
    if (best[tsp_index] == ok_targets.length-1){
      console.log("\nВернулись в свою точку");
      throw "Вернулись в свою точку";
    }

    shortest_path = check_no_way(tsp_index, graph, self, new_diamonds, screen);
   
  }
  else{
    shortest_path = check_no_way(tsp_index, graph, self, new_diamonds, screen);
  }
 
  all_diamonds = new_diamonds;

  // console.log("\n");
  // if (is_forward_tsp){
  //   for (var i = tsp_index; i< best.length; ++i ){
  //     var target = ok_targets[best[i]];
  //     console.log(target.x + " " + target.y);
  //   }
  // }
  // else{
  //   for (var i = tsp_index; i>= 0; --i ){
  //     var target = ok_targets[best[i]];
  //     console.log(target.x + " " + target.y);
  //   }
  // }
  return shortest_path;
}

function check_no_way(tsp_index, graph, self, diamonds, screen){
  var is_no_way = false;
  if (ok_targets.length == 0) return undefined;//Нас заперли
  var diamond = ok_targets[best[tsp_index]];   
  if (diamond == undefined){//TODO: падает
    console.log("\nbest_length: " + best.length);
    console.log("\ntsp_index: " + tsp_index);
    throw "ЖОПА";
  }
 
  var start = graph.grid[self.x][self.y];
  var shortest_path = undefined;
  if (graph.grid[diamond.x][diamond.y].weight == 0){
    is_no_way = true;
  }
  else {
    
    var end = graph.grid[diamond.x][diamond.y];
    shortest_path = astar.search(graph, start, end);
    if (shortest_path.length == 0){
      is_no_way = true;
    }
  }

  if (is_no_way){
    console.log("\nNO WAY!!!!");
    initData();
    shortest_path = build_tsp_way(diamonds,self, graph,screen);
  } 
  else{
    var diamond = ok_targets[best[tsp_index]];   
    var end = graph.grid[diamond.x][diamond.y]; 
    shortest_path = astar.search(graph, start, end);    
  }
  return shortest_path;
}

function get_tsp_path(targets, self, graph, screen){
  points = [];
  var start = graph.grid[self.x][self.y];

  var ok_targets=[];
  targets.forEach(function(target) {
    if (graph.grid[target.x][target.y].weight == 0) return;
    var end = graph.grid[target.x][target.y];
    var path = astar.search(graph, start, end);
    if (path.length == 0) return;

    ok_targets.push(target);
    points.push(new Point(target.x, target.y));
  }, this);  

  if (points.length == 0) return undefined;
  if (points.length == 1){
    var end = graph.grid[ok_targets[0].x][ok_targets[0].y];
    console.log("\n1 point!!!!!!!!!!!!!!!!");
    return astar.search(graph, start, end);
  }

  ok_targets.push(self);
  points.push(new Point(self.x, self.y));
  
  GAInitialize();
  running = true;
  draw();

  var pathes = [];
  for (var i = 0; i < best.length; ++i){
    var start_tmp = graph.grid[ok_targets[i].x][ok_targets[i].y];
   
    var end_tmp =i < best.length - 1 ? graph.grid[ok_targets[i+1].x][ok_targets[i+1].y] : 
      graph.grid[ok_targets[0].x][ok_targets[0].y];

    var path = astar.search(graph, start_tmp, end_tmp);
    pathes.push(path);
    
  } 
 
  var self_index = best.indexOf(points.length - 1);
  var next_target = self_index < best.length - 1 ? ok_targets[best[self_index + 1]] : ok_targets[0];
  var prev_target = self_index > 0 ? ok_targets[best[self_index - 1]] : ok_targets[best[best.length - 1]];

  var next_end = graph.grid[next_target.x][next_target.y];
  var next_path = astar.search(graph, start, next_end);
  
  var prev_end = graph.grid[prev_target.x][prev_target.y];
  var prev_path = astar.search(graph, start, prev_end);

  var best_path = next_path.length < prev_path.length ? next_path : prev_path;

  
  console.log("\n");
  for (let i = 0; i<screen_height; i++){
    var res ="";
    for (let j = 0; j<screen[i].length; j++) {
      if (self.x == i && self.y == j){
        res += "A";
      }
      else if (screen[i][j]=='*'){
        res += "*";
      }
      else if (best_path.findIndex(p=> p.x == i && p.y == j) > -1){
        res += "+";
      }       
      else if (pathes.findIndex(p=> p.findIndex(pp => pp.x == i && pp.y == j) > -1) > -1){
        res += "-";
      }   
      else {
        res += ' ';
      }
    
    }
    console.log(res);
  }		 
    
 
  return best_path;
}




//function play(screen){
exports.play = function*(screen){
    while (true){	
      
  
    
     

    screen_height = screen.length - 1;
  
    let self = find_targets('A',screen)[0];    
  

    var graph = init_graph(screen, self, false);
    set_movable_stones_weight(screen, self, graph);
    var butt_graph = init_graph(screen, self, true);
  

    var nearest_corner = get_nearest_corner(self.x, self.y, screen);
        
    //Чтобы на нас не упал камень
    afraid_of_stones_and_diamonds(screen, graph, self.x, self.y)
    
    //боимся бабочек
    var butts = find_targets('/|-\\', screen);
    if (close_butts == undefined) close_butts = butts;
    check_closed_butts(screen);       
    afraid_of_butterfly(screen, graph, self, butts, butt_graph);   

    var shortest_path = undefined;
    //сначала открываем бабачек
    //shortest_path = get_shortest_path(self, close_butts, graph, false);

    var diamonds = find_targets('*', screen);
    set_trap_diamonds(diamonds, screen, graph); 
    
    // console.log("\n");
    // for (let i = 0; i<screen_height; i++){
    //   var res ="";
    //   for (let j = 0; j<screen[i].length; j++) {
    //     if (self.x == i && self.y == j){
    //       res += "A";
    //     }
                   
    //     else {
    //       res += butt_graph.grid[i][j].weight;
    //     }
      
    //   }
    //   console.log(res);
    // }		 

   //потом ищем алмазы
    if (shortest_path == undefined){
     shortest_path = get_path(diamonds, self, screen, graph); 
    }
         
    
    if (shortest_path == undefined){
      console.log("\nNo appropriate diamonds 1");    
      
      //потом ище пути, чтобы убить бабочек
      shortest_path = get_path_to_kill_butt(butts, screen, graph, self);     

      //потом жрем ближайшую землю
      if (shortest_path == undefined){    
        if (butts.length == 0 && diamonds.length == 0){
          var x = 1;
          var y = 1;
          var start = graph.grid[self.x][self.y];
         
          while (shortest_path == undefined){
            var end = graph.grid[x][y];
            if (end.weight == 0){
              y++;
              continue;
            } 
            var path = astar.search(graph, start, end);
            if (path.length == 0) {
              y++;
              continue;
            }
            shortest_path = path;
          }
        }  
        else{
          var dirts = find_targets(':', screen);
          set_trap_diamonds(dirts, screen, graph);
          var shortest_path = get_shortest_path(self, dirts, graph, false);
        }
      }
    }


    
    


    var move= '';
    if (shortest_path != undefined){
      
      var first_step = shortest_path[0];
      if (first_step.y < self.y)
        move= 'l';
      else if (first_step.y > self.y)
        move= 'r';
      else if (first_step.x < self.x)
        move= 'u';
      else if (first_step.x > self.x)
        move= 'd';	
      else throw "Strange move";      
    }
    else{
      console.log("STAYING!!!!!!!!!!!!!!");
      // if ('*: '.includes(screen[self.x][self.y + 1])){
      //   move='r';
      // }
      // else if ('*: '.includes(screen[self.x][self.y - 1])){
      //   move='l';
      // }
      // else if('*: '.includes(screen[self.x+1][self.y])){
      //   move='d';
      // }
      // else if ('*: '.includes(screen[self.x-1][self.y])){
      //   move='u';
      // }
    }
    yield move;

    
    // console.clear();

    // console.log("/n");
    // console.log(move);

    // for (var i=0; i < result.length; ++i){
    //   console.log(result[i].x +" " + result[i].y);
    // }
        
      
    }
};































function pathTo(node) {
  var curr = node;
  var path = [];
  while (curr.parent) {
    path.unshift(curr);
    curr = curr.parent;
  }
  return path;
}

function getHeap() {
  return new BinaryHeap(function(node) {
    return node.f;
  });
}

var astar = {
  /**
  * Perform an A* Search on a graph given a start and end node.
  * @param {Graph} graph
  * @param {GridNode} start
  * @param {GridNode} end
  * @param {Object} [options]
  * @param {bool} [options.closest] Specifies whether to return the
             path to the closest node if the target is unreachable.
  * @param {Function} [options.heuristic] Heuristic function (see
  *          astar.heuristics).
  */
  search: function(graph, start, end, options) {
    graph.cleanDirty();
    options = options || {};
    var heuristic = options.heuristic || astar.heuristics.manhattan;
    var closest = options.closest || false;

    var openHeap = getHeap();
    var closestNode = start; // set the start node to be the closest if required

    start.h = heuristic(start, end);
    graph.markDirty(start);

    openHeap.push(start);

    while (openHeap.size() > 0) {

      // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
      var currentNode = openHeap.pop();

      // End case -- result has been found, return the traced path.
      if (currentNode === end) {
        return pathTo(currentNode);
      }

      // Normal case -- move currentNode from open to closed, process each of its neighbors.
      currentNode.closed = true;

      // Find all neighbors for the current node.
      var neighbors = graph.neighbors(currentNode);

      for (var i = 0, il = neighbors.length; i < il; ++i) {
        var neighbor = neighbors[i];

        if (neighbor.closed || neighbor.isWall()) {
          // Not a valid node to process, skip to next neighbor.
          continue;
        }

        // The g score is the shortest distance from start to current node.
        // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
        var gScore = currentNode.g + neighbor.getCost(currentNode);
        var beenVisited = neighbor.visited;

        if (!beenVisited || gScore < neighbor.g) {

          // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
          neighbor.visited = true;
          neighbor.parent = currentNode;
          neighbor.h = neighbor.h || heuristic(neighbor, end);
          neighbor.g = gScore;
          neighbor.f = neighbor.g + neighbor.h;
          graph.markDirty(neighbor);
          if (closest) {
            // If the neighbour is closer than the current closestNode or if it's equally close but has
            // a cheaper path than the current closest node then it becomes the closest node
            if (neighbor.h < closestNode.h || (neighbor.h === closestNode.h && neighbor.g < closestNode.g)) {
              closestNode = neighbor;
            }
          }

          if (!beenVisited) {
            // Pushing to heap will put it in proper place based on the 'f' value.
            openHeap.push(neighbor);
          } else {
            // Already seen the node, but since it has been rescored we need to reorder it in the heap
            openHeap.rescoreElement(neighbor);
          }
        }
      }
    }

    if (closest) {
      return pathTo(closestNode);
    }

    // No result was found - empty array signifies failure to find path.
    return [];
  },
  // See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
  heuristics: {
    manhattan: function(pos0, pos1) {
      var d1 = Math.abs(pos1.x - pos0.x);
      var d2 = Math.abs(pos1.y - pos0.y);
      return d1 + d2;
    },
    diagonal: function(pos0, pos1) {
      var D = 1;
      var D2 = Math.sqrt(2);
      var d1 = Math.abs(pos1.x - pos0.x);
      var d2 = Math.abs(pos1.y - pos0.y);
      return (D * (d1 + d2)) + ((D2 - (2 * D)) * Math.min(d1, d2));
    }
  },
  cleanNode: function(node) {
    node.f = 0;
    node.g = 0;
    node.h = 0;
    node.visited = false;
    node.closed = false;
    node.parent = null;
  }
};

/**
 * A graph memory structure
 * @param {Array} gridIn 2D array of input weights
 * @param {Object} [options]
 * @param {bool} [options.diagonal] Specifies whether diagonal moves are allowed
 */
function Graph(gridIn, options) {
  options = options || {};
  this.nodes = [];
  this.diagonal = !!options.diagonal;
  this.grid = [];
  for (var x = 0; x < gridIn.length; x++) {
    this.grid[x] = [];

    for (var y = 0, row = gridIn[x]; y < row.length; y++) {
      var node = new GridNode(x, y, row[y]);
      this.grid[x][y] = node;
      this.nodes.push(node);
    }
  }
  this.init();
}

Graph.prototype.init = function() {
  this.dirtyNodes = [];
  for (var i = 0; i < this.nodes.length; i++) {
    astar.cleanNode(this.nodes[i]);
  }
};

Graph.prototype.cleanDirty = function() {
  for (var i = 0; i < this.dirtyNodes.length; i++) {
    astar.cleanNode(this.dirtyNodes[i]);
  }
  this.dirtyNodes = [];
};

Graph.prototype.markDirty = function(node) {
  this.dirtyNodes.push(node);
};

Graph.prototype.neighbors = function(node) {
  var ret = [];
  var x = node.x;
  var y = node.y;
  var grid = this.grid;

  // West
  if (grid[x - 1] && grid[x - 1][y]) {
    ret.push(grid[x - 1][y]);
  }

  // East
  if (grid[x + 1] && grid[x + 1][y]) {
    ret.push(grid[x + 1][y]);
  }

  // South
  if (grid[x] && grid[x][y - 1]) {
    ret.push(grid[x][y - 1]);
  }

  // North
  if (grid[x] && grid[x][y + 1]) {
    ret.push(grid[x][y + 1]);
  }

  if (this.diagonal) {
    // Southwest
    if (grid[x - 1] && grid[x - 1][y - 1]) {
      ret.push(grid[x - 1][y - 1]);
    }

    // Southeast
    if (grid[x + 1] && grid[x + 1][y - 1]) {
      ret.push(grid[x + 1][y - 1]);
    }

    // Northwest
    if (grid[x - 1] && grid[x - 1][y + 1]) {
      ret.push(grid[x - 1][y + 1]);
    }

    // Northeast
    if (grid[x + 1] && grid[x + 1][y + 1]) {
      ret.push(grid[x + 1][y + 1]);
    }
  }

  return ret;
};

Graph.prototype.toString = function() {
  var graphString = [];
  var nodes = this.grid;
  for (var x = 0; x < nodes.length; x++) {
    var rowDebug = [];
    var row = nodes[x];
    for (var y = 0; y < row.length; y++) {
      rowDebug.push(row[y].weight);
    }
    graphString.push(rowDebug.join(" "));
  }
  return graphString.join("\n");
};

function GridNode(x, y, weight) {
  this.x = x;
  this.y = y;
  this.weight = weight;
}

GridNode.prototype.toString = function() {
  return "[" + this.x + " " + this.y + "]";
};

GridNode.prototype.getCost = function(fromNeighbor) {
  // Take diagonal weight into consideration.
  if (fromNeighbor && fromNeighbor.x != this.x && fromNeighbor.y != this.y) {
    return this.weight * 1.41421;
  }
  return this.weight;
};

GridNode.prototype.isWall = function() {
  return this.weight === 0;
};

function BinaryHeap(scoreFunction) {
  this.content = [];
  this.scoreFunction = scoreFunction;
}

BinaryHeap.prototype = {
  push: function(element) {
    // Add the new element to the end of the array.
    this.content.push(element);

    // Allow it to sink down.
    this.sinkDown(this.content.length - 1);
  },
  pop: function() {
    // Store the first element so we can return it later.
    var result = this.content[0];
    // Get the element at the end of the array.
    var end = this.content.pop();
    // If there are any elements left, put the end element at the
    // start, and let it bubble up.
    if (this.content.length > 0) {
      this.content[0] = end;
      this.bubbleUp(0);
    }
    return result;
  },
  remove: function(node) {
    var i = this.content.indexOf(node);

    // When it is found, the process seen in 'pop' is repeated
    // to fill up the hole.
    var end = this.content.pop();

    if (i !== this.content.length - 1) {
      this.content[i] = end;

      if (this.scoreFunction(end) < this.scoreFunction(node)) {
        this.sinkDown(i);
      } else {
        this.bubbleUp(i);
      }
    }
  },
  size: function() {
    return this.content.length;
  },
  rescoreElement: function(node) {
    this.sinkDown(this.content.indexOf(node));
  },
  sinkDown: function(n) {
    // Fetch the element that has to be sunk.
    var element = this.content[n];

    // When at 0, an element can not sink any further.
    while (n > 0) {

      // Compute the parent element's index, and fetch it.
      var parentN = ((n + 1) >> 1) - 1;
      var parent = this.content[parentN];
      // Swap the elements if the parent is greater.
      if (this.scoreFunction(element) < this.scoreFunction(parent)) {
        this.content[parentN] = element;
        this.content[n] = parent;
        // Update 'n' to continue at the new position.
        n = parentN;
      }
      // Found a parent that is less, no need to sink any further.
      else {
        break;
      }
    }
  },
  bubbleUp: function(n) {
    // Look up the target element and its score.
    var length = this.content.length;
    var element = this.content[n];
    var elemScore = this.scoreFunction(element);

    while (true) {
      // Compute the indices of the child elements.
      var child2N = (n + 1) << 1;
      var child1N = child2N - 1;
      // This is used to store the new position of the element, if any.
      var swap = null;
      var child1Score;
      // If the first child exists (is inside the array)...
      if (child1N < length) {
        // Look it up and compute its score.
        var child1 = this.content[child1N];
        child1Score = this.scoreFunction(child1);

        // If the score is less than our element's, we need to swap.
        if (child1Score < elemScore) {
          swap = child1N;
        }
      }

      // Do the same checks for the other child.
      if (child2N < length) {
        var child2 = this.content[child2N];
        var child2Score = this.scoreFunction(child2);
        if (child2Score < (swap === null ? elemScore : child1Score)) {
          swap = child2N;
        }
      }

      // If the element needs to be moved, swap it, and continue.
      if (swap !== null) {
        this.content[n] = this.content[swap];
        this.content[swap] = element;
        n = swap;
      }
      // Otherwise, we are done.
      else {
        break;
      }
    }
  }
};






function GAInitialize() {
  countDistances();
  for(var i=0; i<POPULATION_SIZE; i++) {
    population.push(randomIndivial(points.length));
  }
  setBestValue();
}
function GANextGeneration() {
  currentGeneration++;
  selection();
  crossover();
  mutation();

  //if(UNCHANGED_GENS > POPULATION_SIZE + ~~(points.length/10)) {
    //MUTATION_PROBABILITY = 0.05;
    //if(doPreciseMutate) {
    //  best = preciseMutate(best);
    //  best = preciseMutate1(best);
    //  if(evaluate(best) < bestValue) {
    //    bestValue = evaluate(best);
    //    UNCHANGED_GENS = 0;
    //    doPreciseMutate = true;
    //  } else {
    //    doPreciseMutate = false;
    //  }
    //}
  //} else {
    //doPreciseMutate = 1;
    //MUTATION_PROBABILITY = 0.01;
  //}
  setBestValue();
}
function tribulate() {
  //for(var i=0; i<POPULATION_SIZE; i++) {
  for(var i=population.length>>1; i<POPULATION_SIZE; i++) {
    population[i] = randomIndivial(points.length);
  }	
}
function selection() {
  var parents = new Array();
  var initnum = 4;
  parents.push(population[currentBest.bestPosition]);
  parents.push(doMutate(best.clone()));
  parents.push(pushMutate(best.clone()));
  parents.push(best.clone());

  setRoulette();
  for(var i=initnum; i<POPULATION_SIZE; i++) {
    parents.push(population[wheelOut(Math.random())]);
  }
  population = parents;
}
function crossover() {
  var queue = new Array();
  for(var i=0; i<POPULATION_SIZE; i++) {
    if( Math.random() < CROSSOVER_PROBABILITY ) {
      queue.push(i);
    }
  } 
  queue.shuffle();
  for(var i=0, j=queue.length-1; i<j; i+=2) {
    doCrossover(queue[i], queue[i+1]);
    //oxCrossover(queue[i], queue[i+1]);
  }
}
//function oxCrossover(x, y) {	
//  //var px = population[x].roll();
//  //var py = population[y].roll();
//  var px = population[x].slice(0);
//  var py = population[y].slice(0);

//  var rand = randomNumber(points.length-1) + 1;
//  var pre_x = px.slice(0, rand);
//  var pre_y = py.slice(0, rand);

//  var tail_x = px.slice(rand, px.length);
//  var tail_y = py.slice(rand, py.length);

//  px = tail_x.concat(pre_x);
//  py = tail_y.concat(pre_y);

//  population[x] = pre_y.concat(px.reject(pre_y));
//  population[y] = pre_x.concat(py.reject(pre_x));
//}
function doCrossover(x, y) {
  var child1 = getChild('next', x, y);
  var child2 = getChild('previous', x, y);
  population[x] = child1;
  population[y] = child2;
}
function getChild(fun, x, y) {
  var solution = new Array();
  var px = population[x].clone();
  var py = population[y].clone();
  var dx,dy;
  var c = px[randomNumber(px.length)];
  solution.push(c);
  while(px.length > 1) {
    dx = px[fun](px.indexOf(c));
    dy = py[fun](py.indexOf(c));
    px.deleteByValue(c);
    py.deleteByValue(c);
    c = dis[c][dx] < dis[c][dy] ? dx : dy;
    solution.push(c);
  }
  return solution;
}
function mutation() {
  for(var i=0; i<POPULATION_SIZE; i++) {
    if(Math.random() < MUTATION_PROBABILITY) {
      if(Math.random() > 0.5) {
        population[i] = pushMutate(population[i]);
      } else {
        population[i] = doMutate(population[i]);
      }
      i--;
    }
  }
}
function preciseMutate(orseq) {  
  var seq = orseq.clone();
  if(Math.random() > 0.5){
    seq.reverse();
  }
  var bestv = evaluate(seq);
  for(var i=0; i<(seq.length>>1); i++) {
    for(var j=i+2; j<seq.length-1; j++) {
      var new_seq = swap_seq(seq, i,i+1,j,j+1);
      var v = evaluate(new_seq);
      if(v < bestv) {bestv = v, seq = new_seq; };
    }
  }
  //alert(bestv);
  return seq;
}
function preciseMutate1(orseq) {  
  var seq = orseq.clone();
  var bestv = evaluate(seq);

  for(var i=0; i<seq.length-1; i++) {
    var new_seq = seq.clone();
    new_seq.swap(i, i+1);
    var v = evaluate(new_seq);
    if(v < bestv) {bestv = v, seq = new_seq; };
  }
  //alert(bestv);
  return seq;
}
function swap_seq(seq, p0, p1, q0, q1) {
  var seq1 = seq.slice(0, p0);
  var seq2 = seq.slice(p1+1, q1);
  seq2.push(seq[p0]);
  seq2.push(seq[p1]);
  var seq3 = seq.slice(q1, seq.length);
  return seq1.concat(seq2).concat(seq3);
}
function doMutate(seq) {
  mutationTimes++;
  var m,n;
  // m and n refers to the actual index in the array
  // m range from 0 to length-2, n range from 2...length-m
  do {
    m = randomNumber(seq.length - 2);
    n = randomNumber(seq.length);
  } while (m>=n)

    for(var i=0, j=(n-m+1)>>1; i<j; i++) {
      seq.swap(m+i, n-i);
    }
    return seq;
}
function pushMutate(seq) {
  mutationTimes++;
  var m,n;
  do {
    m = randomNumber(seq.length>>1);
    n = randomNumber(seq.length);
  } while (m>=n)

  var s1 = seq.slice(0,m);
  var s2 = seq.slice(m,n)
  var s3 = seq.slice(n,seq.length);
  return s2.concat(s1).concat(s3).clone();
}
function setBestValue() {
  for(var i=0; i<population.length; i++) {
    values[i] = evaluate(population[i]);
  }
  currentBest = getCurrentBest();
  if(bestValue === undefined || bestValue > currentBest.bestValue) {
    best = population[currentBest.bestPosition].clone();
    bestValue = currentBest.bestValue;
    UNCHANGED_GENS = 0;
  } else {
    UNCHANGED_GENS += 1;
  }

  if (UNCHANGED_GENS == 10){
      running = false;
  }
}
function getCurrentBest() {
  var bestP = 0,
  currentBestValue = values[0];

  for(var i=1; i<population.length; i++) {
    if(values[i] < currentBestValue) {
      currentBestValue = values[i];
      bestP = i;
    }
  }
  return {
    bestPosition : bestP
    , bestValue    : currentBestValue
  }
}
function setRoulette() {
  //calculate all the fitness
  for(var i=0; i<values.length; i++) { fitnessValues[i] = 1.0/values[i]; }
  //set the roulette
  var sum = 0;
  for(var i=0; i<fitnessValues.length; i++) { sum += fitnessValues[i]; }
  for(var i=0; i<roulette.length; i++) { roulette[i] = fitnessValues[i]/sum; }
  for(var i=1; i<roulette.length; i++) { roulette[i] += roulette[i-1]; }
}
function wheelOut(rand) {
  var i;
  for(i=0; i<roulette.length; i++) {
    if( rand <= roulette[i] ) {
      return i;
    }
  }
}
function randomIndivial(n) {
  var a = [];
  for(var i=0; i<n; i++) {
    a.push(i);
  }
  return a.shuffle();
}
function evaluate(indivial) {
  var sum = dis[indivial[0]][indivial[indivial.length - 1]];
  for(var i=1; i<indivial.length; i++) {
    sum += dis[indivial[i]][indivial[i-1]];
  }
  return sum;
}
function countDistances() {
  var length = points.length;
  dis = new Array(length);
  for(var i=0; i<length; i++) {
    dis[i] = new Array(length);
    for(var j=0; j<length; j++) {
      dis[i][j] = ~~distance(points[i], points[j]); 
    }
  }
}

Array.prototype.clone = function() { return this.slice(0); }
Array.prototype.shuffle = function() {
  for(var j, x, i = this.length-1; i; j = randomNumber(i), x = this[--i], this[i] = this[j], this[j] = x);
  return this;
};
Array.prototype.indexOf = function (value) {	
  for(var i=0; i<this.length; i++) {
    if(this[i] === value) {
      return i;
    }
  }
}
Array.prototype.deleteByValue = function (value) {
  var pos = this.indexOf(value);
  this.splice(pos, 1);
}
Array.prototype.next = function (index) {
  if(index === this.length-1) {
    return this[0];
  } else {
    return this[index+1];
  }
}
Array.prototype.previous = function (index) {
  if(index === 0) {
    return this[this.length-1];
  } else {
    return this[index-1];
  }
}
Array.prototype.swap = function (x, y) {
  if(x>this.length || y>this.length || x === y) {return}
  var tem = this[x];
  this[x] = this[y];
  this[y] = tem;
}
Array.prototype.roll = function () {
  var rand = randomNumber(this.length);
  var tem = [];
  for(var i = rand; i<this.length; i++) {
    tem.push(this[i]);
  }
  for(var i = 0; i<rand; i++) {
    tem.push(this[i]);
  }
  return tem;
}
Array.prototype.reject = function (array) {
  return $.map(this,function (ele) {
    return $.inArray(ele, array) < 0 ? ele : null;
  })
}
function intersect(x, y) {
  return $.map(x, function (xi) {
    return $.inArray(xi, y) < 0 ? null : xi;
  })
}
function Point(x, y) {
  this.x = x;
  this.y = y;
}
function randomNumber(boundary) {
  return parseInt(Math.random() * boundary);
  //return Math.floor(Math.random() * boundary);
}

function distance(p1, p2) {
  return euclidean(p1.x-p2.x, p1.y-p2.y);
}
function euclidean(dx, dy) {
  return Math.sqrt(dx*dx + dy*dy);
}


var points = [];
var running;
var doPreciseMutate;

var POPULATION_SIZE;
var ELITE_RATE;
var CROSSOVER_PROBABILITY;
var MUTATION_PROBABILITY;
var OX_CROSSOVER_RATE;
var UNCHANGED_GENS;

var mutationTimes;
var dis;
var bestValue, best;
var currentGeneration;
var currentBest;
var population;
var values;
var fitnessValues;
var roulette;


function initData() {
  running = false;
  POPULATION_SIZE = 30;
  ELITE_RATE = 0.3;
  CROSSOVER_PROBABILITY = 0.9;
  MUTATION_PROBABILITY  = 0.01;
  //OX_CROSSOVER_RATE = 0.05;
  UNCHANGED_GENS = 0;
  mutationTimes = 0;
  doPreciseMutate = true;

  bestValue = undefined;
  best = [];
  currentGeneration = 0;
  currentBest;
  population = []; //new Array(POPULATION_SIZE);
  values = new Array(POPULATION_SIZE);
  fitnessValues = new Array(POPULATION_SIZE);
  roulette = new Array(POPULATION_SIZE);
}


function draw() {
  while(running) {
    GANextGeneration();   
  }
}






var stones = [];
var screen_height = 0;
var close_butts=undefined;
var is_tsp_data_initialized = false;
var tsp_index = undefined;

var ok_targets=[];
var all_diamonds =[];
var is_forward_tsp = true;

var CORNER_TYPE={
  LD:1,
  LT:2,
  RT:3,
  RD:4
};

//  var screen = 
//  ["A     ", 
//   " :::: ",
//   " :/ : ",
//   " :: : ",
//   "   + *"]; 
 
//  play(screen);



