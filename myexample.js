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


function get_butt_kill_stones(butt_pathes, screen, graph){
  let all_stones = [];

  for (let i = 0; i < butt_pathes.length; ++i){

    let bp = butt_pathes[i];
    let stones = [];
    let wrong_stones = [];
    //var checked_ys = [];
    bp.forEach(function(point) {
      var x = point.x;
      var y = point.y;

      if (wrong_stones.findIndex(ws => ws.y == y) > -1) {
        stones.push(undefined);
        return; 
      }
      //if (stones.findIndex(s => s.y == y) > -1) return; //TODO: здесь м.б. 2 камня с одинак. y
      
       //если камень лежит прямо над проходом, мы не сможем им убить
       if ('O*'.includes(screen[x-1][y])){
         wrong_stones.push({x:x-1, y:y});
       }
      else if ('O*'.includes(screen[x-1][y-1])){ //мы будем стоять на расст. 1 слева или справа от бабочки
        wrong_stones.push({x:x-1, y:y-1});
      }
      else if ('O*'.includes(screen[x-1][y+1])){
        wrong_stones.push({x:x-1, y:y+1});
      }

      var can_kill = false;    
      let is_dirt_found = false; 
      let dirt_x = undefined;
      let butt_y = y;
      while (true){      

        x--;     
        if ('O*'.includes(screen[x][y])){
          can_kill = true;
          break;
        }      
        //боковые камни
        else if (':A'.includes(screen[x][y]) && 
          'O*'.includes(screen[x][y-1]) && '+O*'.includes(screen[x+1][y-1])
          && (': *'.includes(screen[x-1][y]) || ': *'.includes(screen[1][y+1]) )){        
          
            if (!is_dirt_found){
              is_dirt_found = true;
              dirt_x = x;
            }
            y = y-1;
            can_kill = true; //TODO: проверить, надо ли выходить
            break;         
        }  
        else if (':A'.includes(screen[x][y]) && 
          'O*'.includes(screen[x][y+1]) && '+O*'.includes(screen[x+1][y+1])
          && (': *'.includes(screen[x-1][y]) || ': *'.includes(screen[1][y-1]) )){        
          
            if (!is_dirt_found){
              is_dirt_found = true;
              dirt_x = x;
            }

            y = y + 1;
            can_kill = true;
            break;         
        }  
        
       
        else if (!is_dirt_found && ':'.includes(screen[x][y])){
          dirt_x = x;
          is_dirt_found = true;          
        }
        else if (!is_dirt_found && 'A'.includes(screen[x][y]) && 'O*'.includes(screen[x-1][y])){ 
          dirt_x = x;
          is_dirt_found = true;
        }
        
        else if ('+#'.includes(screen[x][y])){
          //console.log("\n" + x + " " + y);
          break;
        }        
      }
      
      if (can_kill && is_dirt_found && graph.grid[dirt_x][butt_y].weight != 0){  //==0, если там бабочка         
        stones.push({x:x, y:y, butt_x: dirt_x, butt_y:butt_y});       
      }  
      else{
        stones.push(undefined);
      }    
     
    }, this);
    all_stones.push(stones);
  }
 
  return all_stones;
}


function get_butt_kill_min_time_stone(stones, path, self, graph){
   
  
  
  // stones.forEach(function(s) {
  //   console.log(s.x + " " + s.y);
  // }, this);
  let start = graph.grid[self.x][self.y];

  let ok_stones = [];
  let legs = 0;
  //console.log(path[0]);

  // let res_path="";
  // path.forEach(function(p) {
  //   res_path += p.x + "," + p.y +","+p.dir+" ";
  // }, this);
  // console.log(res_path);
  
  for (let i = 0; i < path.length; ++i){
    let step = path[i];
    
    let stone = stones[i];
    if (stone == undefined) continue;
    //делаем точку, держащую камень непроходимой
    if (stone.butt_x - stone.x == 1){
      graph.grid[stone.butt_x][stone.y].weight = 0;
    }
  }


  for (let i = 0; i < stones.length; ++i){
    let stone = stones[i];
    let step = path[i];
    if (stone == undefined) continue;


    if (stone.butt_x - stone.x == 1){
      graph.grid[stone.butt_x][stone.y].weight = 1;
    }

    let kill_time = 0;
      
    let end = graph.grid[stone.butt_x][stone.butt_y];
  
    let path_to_butt_x = astar.search(graph, start, end);
    let butt_x_time = path_to_butt_x.length;
    kill_time += path_to_butt_x.length;


    if (stone.y == stone.butt_y){
      kill_time += stone.butt_x - (stone.x + 1);
    }
    else{
      kill_time += stone.butt_x - stone.x;
    }

    if (stone.y <= stone.butt_y) kill_time++;      //+1 - время нашего отхода от камня

    if (stone.y != stone.butt_y) kill_time++; //камень идет вбок
          
    kill_time += step.x - stone.x; //время падения камня на бабочку

    //console.log(kill_time);


    var legs_count = Math.floor(kill_time/path.length);

    butt_x_time %= path.length; //убираем лишние круги бабочки
    kill_time %= path.length;
    

   

    let dangerous_path=[];

    if (kill_time <= i + 1){ //успеем убить бабочку на 1 круге 
      for (let j = butt_x_time; j < i; ++j){
        dangerous_path.push(path[j]);
      }
    }
    else{ //бабочка пройдет путь от butt_x_time до конца пути, потом от начала пути до i
      
      for (let j = butt_x_time; j < path.length; ++j){
        dangerous_path.push(path[j]);
      }
      for (let j = 0; j < i; ++j){
        dangerous_path.push(path[j]);
      }      
    }

   

    var is_dangerous = false;
    for (let k = 0; k < dangerous_path.length; ++k){
      let d_step = dangerous_path[k];
      if (get_manhatten_dist(d_step.x, d_step.y, stone.butt_x, stone.butt_y) <= 1){
        is_dangerous = true;
        break;
      }
    }

    // if (stone.x == 17 && stone.y == 24){
    //   console.log("\n\nis dangerous: " + is_dangerous + " " + kill_time + "                                                                                           ");
    //   var dp_str = "";
    //   dangerous_path.forEach(function(dp) {
    //     dp_str += dp.x + "," + dp.y + " ";
    //   }, this);
    //   console.log(dp_str +"                                                                                                                                ");    
    // }

    if (!is_dangerous){
      let new_stone = {
        stone:stone, 
        time:legs_count * path.length + kill_time, 
        step_time:legs_count * path.length + i, 
        path_x:step.x, 
        path_y:step.y,
        dangerous_path:dangerous_path
      };         
      ok_stones.push(new_stone);  

    }

    if (stone.butt_x - stone.x == 1){
      graph.grid[stone.butt_x][stone.y].weight = 0;
    }

  }






  // let wrong_stones = [];//камни, которые нам не подходят (лежат рядом с бабочкой)

  // while (ok_stones.length == 0){
  //   for (let i = 0; i < path.length; ++i){
      
  //     let step = path[i];
      
  //     // if (legs == 0){
  //     //   console.log(step.x +" " + step.y);
  //     // }

  //     let step_time = i + legs * path.length; // время, за которое бабочка достигнет точки step
  //     let stone = stones[i];
  //     if (stone == undefined) continue; //нет потенциального камня для убийства
    
         
      
  //     if (stone.x > step.x) continue; //камень ниже
      
  //     var ok_stone_index = ok_stones.findIndex(os => os.stone.x == stone.x && os.stone.y == stone.y);
  //     if (ok_stone_index > -1) continue; //этот камень применим для более раннней точки пути
      
  //     var wrong_stone_index = wrong_stones.findIndex(ws => ws.x == stone.x && ws.y == stone.y);
  //     if (wrong_stone_index > -1) continue; //этот камень нам не подходит
      
      
  //     if (stone.butt_x - stone.x == 1){
  //       graph.grid[stone.butt_x][stone.y].weight = 1;
  //     }
      
  //     let time = 0;
      
  //     let end = graph.grid[stone.butt_x][stone.butt_y];
    
  //     let path_to_butt_x = astar.search(graph, start, end);
  //     time += path_to_butt_x.length;
  //     //console.log(time);
      
  //     if (stone.y == stone.butt_y){
  //       time += stone.butt_x - (stone.x + 1);
  //     }
  //     else{
  //       time += stone.butt_x - stone.x;
  //     }

  //     if (stone.y <= stone.butt_y) time++;      //+1 - время нашего отхода от камня
           
  //     time += step.x - stone.x; //время падения камня на бабочку
      
     

  //     // if (i==2){
  //     //   console.log(step.x + " " + step.y + " " +  time + " " + step_time+ "\n");
  //     // }

  //     //if (stone.x == 12 && stone.y == 11) console.log(i + "\n");
  //     // if (legs == 0)
  //     // console.log("\n" + step.x + " " + step.y + " " + step_time);
       
  //     // if (i < 5){
  //     //   console.log(stone.x + " " + stone.y + " " + time +" " + step_time);
  //     // }
  //     if (time <= step_time + 1){ //камень успеет упасть 
  //       let index = ok_stones.findIndex(os => os.stone.x == stone.x && os.stone.y == stone.y);
  //       // if (index == -1){ //если уже есть, такая точка на пути, то она будет раньше
  //       //   ok_stones[index].time = Math.min(time, ok_stones[index].time);
  //       // }
  //       // else{
  //         let new_stone = {stone:stone, time:time, step_time:step_time, path_x:step.x, path_y:step.y};         
  //         ok_stones.push(new_stone);              
  //       // }
  //     }
  //     else{
  //       if (stone.y==stone.butt_y){
  //         if (get_manhatten_dist(stone.x-1, stone.y, step.x, step.y) <= 1){
  //           wrong_stones.push(stone);
  //         }         
  //       }
  //       else if (stone.y < stone.butt_y){
  //         if (get_manhatten_dist(stone.x, stone.y + 1, step.x, step.y) <= 1){
  //           wrong_stones.push(stone);
  //         }   
  //       }
  //       else if (stone.y > stone.butt_y){
  //         if (get_manhatten_dist(stone.x, stone.y - 1, step.x, step.y) <= 1){
  //           wrong_stones.push(stone);
  //         }   
  //       }
  //     }

  //     if (stone.butt_x - stone.x == 1){
  //       graph.grid[stone.butt_x][stone.y].weight = 0;
  //     }
      
       
  //   }  

    
   

  //   legs++;
  //   if (legs > 10){
  //     console.log("\nCycle: " + path[0].x + ", " + path[0].y);
  //     console.log("wrong stones:" + wrong_stones.length);
  //     //console.log(stones[1].x + ", " + stones[1].y + " " + stones.length);
  //     throw "Cycle";      
  //   }

  // }

  

  let min_time = 999999;
  let min_stone = undefined;

 
  ok_stones.forEach(function(os) {    
    //console.log(stone.stone.x + " " + stone.stone.y + " " + stone.time + " " + stone.step_time + "\n");

    if (os.step_time < min_time){     
      min_time = os.step_time;
      min_stone = os;   
      
    }
  }, this);
 
  
  if (min_stone != undefined && min_stone.stone.butt_x - min_stone.stone.x == 1){
    graph.grid[min_stone.stone.butt_x][min_stone.stone.y].weight = 1;
  }

  // if (min_stone != undefined && min_stone.path_x > 15){
  //   console.log("\n\n" + min_stone.stone.butt_x + " " + min_stone.stone.butt_y + '                                           ')
  // }

  // if (min_stone != undefined && min_stone.path_x > 15){
  //   var dp_str = "";
  //   min_stone.dangerous_path.forEach(function(dp) {
  //     dp_str += dp.x + "," + dp.y + " ";
  //   }, this);
  //   console.log("\n\n"+dp_str +"                                    ");    
  // }
  // else{
  //   console.log("\n\nno way                     ");
  // }

  //console.log(min_stone.path_x + " " + min_stone.path_y);
  return min_stone;  
}



const UP = 0, RIGHT = 1, DOWN = 2, LEFT = 3;
function cw(dir){ return (dir+1) % 4; }
function ccw(dir){ return (dir+3) % 4; }

function get_butt_path(moving_object, screen, path){
  
  if (path.findIndex(p => p.x == moving_object.x && p.y == moving_object.y && p.dir == moving_object.dir) > -1){
    return;
  }
  path.push(moving_object);  

  let left = ccw(moving_object.dir);
  var left_coords = get_new_coords(moving_object, left);
  
  var dir_coords = get_new_coords(moving_object, moving_object.dir);
  
  var new_moving_object = undefined;
  if ('A \\|-/'.includes(screen[left_coords.x][left_coords.y]))
  {
      new_moving_object = {x: left_coords.x, y: left_coords.y, dir: left};   
  }
  else if ('A \\|-/'.includes(screen[dir_coords.x][dir_coords.y])){
      new_moving_object = {x: dir_coords.x, y: dir_coords.y, dir: moving_object.dir};       
  }
  else{
      new_moving_object = {x: moving_object.x, y: moving_object.y, dir: cw(moving_object.dir)};      
  } 

  get_butt_path(new_moving_object, screen, path); 
}

function get_new_coords(moving_object, dir){
  switch (dir){
    case UP:
      return {x:moving_object.x-1, y:moving_object.y};
    case RIGHT:
      return {x:moving_object.x, y:moving_object.y+1};
    case DOWN:
      return {x:moving_object.x+1, y:moving_object.y};
    case LEFT:
      return {x:moving_object.x, y:moving_object.y-1};
  }
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

function set_targets_weight(targets, graph, weight){
  targets.forEach(function(target) {
    graph.grid[target.x][target.y].weight = weight;
  }, this);
}

function init_graph(screen, self)
{
  var arr = []; 
	for (let x = 0; x<screen_height; x++)
    {
		var arrRow = [];
    let row = screen[x];
    for (let y = 0; y<row.length; y++)
    {
      if ('A |/-\\'.includes(screen[x][y]))        
        arrRow.push(1);        
      else if ('+#'.includes(screen[x][y])){           
        arrRow.push(0);
      }
      else if ('*'.includes(screen[x][y])){ 
        arrRow.push(1);
      }
      else if ('O'.includes(screen[x][y])){      
        
          arrRow.push(0);
        
      }  
      else if (':'.includes(screen[x][y])){
        arrRow.push(1);
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
          if (screen[x+1][y]==' ') continue; //если под ним пусто, он упадет - это не движимый камень
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

function afraid_of_explotion(butt_pathes, falling_stones, self, graph){
  butt_pathes.forEach(function(bp) {

    let bp_0 = bp[0];
    let expl_x = bp_0.x;
    let expl_y = bp_0.y;

    let index = falling_stones.findIndex(fs => fs.x == bp_0.x - 1 && fs.y == bp_0.y);
    
    if (index == -1 && bp.length > 1){
      let bp_1 = bp[1];
      index = falling_stones.findIndex(fs => fs.x == bp_1.x - 2 && fs.y == bp_1.y);

      expl_x = bp_1.x;
      expl_y = bp_1.y;

      // if (index > -1){
      //   console.log("Self: " + self.x + " " + self.y);
      //   console.log("\nExplosion:" + expl_x + " " + expl_y);
      // }
    }

    if (index > -1){
      let start_x = expl_x - 1;
      let start_y = expl_y - 1;
      explosion_zones.push({start_x, start_y, stage:0});
      
      for (let j = 0; j < 3; ++j){
        for (let k = 0; k < 3; ++k){
          if (self.x != start_x + j || self.y != start_y + k)
            graph.grid[start_x + j][start_y + k].weight = 0;
        }
      }
    }
  }, this);
}

//метод назначает нулевые веса точкам, которые в опасной близости от бабочек
function afraid_of_butterfly(butt_pathes, graph, self){   
  butt_pathes.forEach(function(bp) {
    var bp_0 = bp[0];
    if (get_manhatten_dist(self.x, self.y, bp[0].x, bp[0].y) == 1){
      graph.grid[bp[0].x][bp[0].y].weight = 0;
    }
    
    var is_my_step_early = is_early_step(self, bp_0);
    if (is_my_step_early){

      var x = bp_0.x - 1; 
      var y = bp_0.y;
      if (get_manhatten_dist(self.x, self.y, x, y) == 1){
        //console.log("!!!!!!!!!!\n")
        graph.grid[x][y].weight = 0;
      }

      x = bp_0.x + 1; 
      y = bp_0.y;
      if (get_manhatten_dist(self.x, self.y, x, y) == 1){
        graph.grid[x][y].weight = 0;
      }

      x = bp_0.x; 
      y = bp_0.y - 1;
      if (get_manhatten_dist(self.x, self.y, x, y) == 1){
        graph.grid[x][y].weight = 0;
      }

      x = bp_0.x; 
      y = bp_0.y + 1;
      if (get_manhatten_dist(self.x, self.y, x, y) == 1){
        graph.grid[x][y].weight = 0;
      }

      //нельзя идти в точку, которая на 1 от бабочки, причем  бабочка будет ходить раньше
      if (bp.length <= 1) return;
      var bp_1 = bp[1];

      x = bp_1.x + 1; 
      y = bp_1.y;
       if (get_manhatten_dist(self.x, self.y, x, y) == 1){
        graph.grid[x][y].weight = 0;
      }

      x = bp_1.x; 
      y = bp_1.y + 1;
       if (get_manhatten_dist(self.x, self.y, x, y) == 1){
        graph.grid[x][y].weight = 0;
      }
    }
    else{
      if (bp.length <= 1) return;
      var bp_1 = bp[1];

      if (get_manhatten_dist(self.x, self.y, bp_1.x, bp_1.y) == 1){
        graph.grid[bp_1.x][bp_1.y].weight = 0;
      }

      var x = bp_1.x + 1;
      var y = bp_1.y;
      if (get_manhatten_dist(self.x, self.y, x, y) == 1){
        graph.grid[x][y].weight = 0;
      }

      x = bp_1.x;
      y = bp_1.y + 1;
      if (get_manhatten_dist(self.x, self.y, x, y) == 1){
        graph.grid[x][y].weight = 0;
      }

      // console.log("\nself: " + self.x + " " + self.y);
      // console.log(x + " " + y);

    }
  }, this);

  // for (let i = 0; i < butts.length; ++i){     
  //   set_butt_weights(screen, graph, butts[i], self, butt_graph);
  // }
}

function is_early_step(obj1, obj2){
  if (obj1.x < obj2.x) return true;
  if (obj1.x == obj2.x) return obj1.y < obj2.y;
  return false;
}


function get_manhatten_dist(x1, y1, x2, y2){
  return Math.abs(x1 - x2) + Math.abs(y1-y2);
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
    if (!isStableStone || isFalling){
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
  return falling_stones;
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

//Метод проверяет, что на карте появилась новая доступная цель, неучтенная на предыдущем шаге TSP
function is_new_ok_targets(targets, graph, start){
  var is_new=false;
  targets.forEach(function(target) {
    if (graph.grid[target.x][target.y].weight == 0) return;
    var end = graph.grid[target.x][target.y];
    var path = astar.search(graph, start, end);
    if (path.length == 0) return;

    var index = points.findIndex(p => p.x == target.x && p.y == target.y);
    if (index == -1){
      is_new = true;      
    }    
  }, this);  
  return is_new;
}

//Строит путь TSP
function build_tsp_way(targets, self, graph, screen){
  //console.log("\nNew way                                                   ")
  points = [];//список точек для алгоримта TSP 
  traversed = [];
  var start = graph.grid[self.x][self.y];
  
  targets.forEach(function(target) {  
    points.push(new Point(target.x, target.y));
  }, this); 

  //добавляем себя в список точек  
  points.push(new Point(self.x, self.y));
  
  GAInitialize();
  running = true;
  draw();

  // console.log("\n"+points.length);
  // console.log("\n"+best.length);

  var self_index = best.indexOf(points.length - 1);
  traversed.push(self_index);
  calc_tps_direction(self_index, self, graph);
  //console.log("\n" + is_forward_tsp);
  
  if (is_forward_tsp){
    tsp_index = self_index < points.length - 1 ? self_index + 1 : 0;
  }
  else{
    tsp_index = self_index > 0 ? self_index - 1 : points.length - 1;
  }


  var diamond = points[best[tsp_index]];   
  var end = graph.grid[diamond.x][diamond.y]; 
  var shortest_path = astar.search(graph, start, end);
  return shortest_path;
}

//Метод вычисляет направление обхода результата TSP - вперед или назад (зависит от расстояния)
function calc_tps_direction(curr_tsp_index, self, graph){
  //console.log("\n!!!");

  var start = graph.grid[self.x][self.y];

  var next_index = curr_tsp_index;
  while(traversed.indexOf(next_index) > -1){   
      next_index = next_index < best.length - 1 ? next_index + 1 : 0;    
  }

  var prev_index = curr_tsp_index;
  while(traversed.indexOf(prev_index) > -1){   
      prev_index = prev_index > 0 ? prev_index - 1 : best.length - 1;   
  }
  // console.log("\n"+best.length);
  // console.log(next_index);
  // console.log(prev_index);
   

  var next_target = points[best[next_index]];
  var prev_target = points[best[prev_index]];

  // console.log("\n" + next_target.x + " " + next_target.y);
  //  console.log(prev_target.x + " " + prev_target.y);

  var next_end = graph.grid[next_target.x][next_target.y];
  var next_path = astar.search(graph, start, next_end);
  
  var prev_end = graph.grid[prev_target.x][prev_target.y];
  var prev_path = astar.search(graph, start, prev_end);

  if (next_path.length == 0 || prev_path.length == 0){
    console.log("Нулевой путь")
    throw ("Нулевой путь");
  }

  // console.log("\n");
  // console.log(next_path.length);
  // console.log(prev_path.length);

  is_forward_tsp = next_path.length < prev_path.length;
}

function get_path(new_diamonds, new_ok_diamonds, self, screen, graph){

  var shortest_path = undefined;
  var start = graph.grid[self.x][self.y];

  //если новых алмазов больше чем было, перестраиваем TSP 
  if (new_ok_diamonds.length > ok_diamonds.length) {
    // console.log("\nNEW DIAMONDS OR NO DIAMONDS!!!!");
    ok_diamonds = new_ok_diamonds;      
    all_diamonds = new_diamonds;
    initData();  
    shortest_path = build_tsp_way(new_ok_diamonds, self, graph, screen);
    return shortest_path;
  }
 
  //проверяем, что все алмазы на своих местах
  var all_diamonds_are_stable = true;
  for (var i = 0; i < new_ok_diamonds.length; ++i){
    var x = new_ok_diamonds[i].x;
    var y = new_ok_diamonds[i].y;
    var is_new_diamond = true;
    for (var j = 0; j < ok_diamonds.length; ++j){
      if (ok_diamonds[j].x == new_ok_diamonds[i].x && ok_diamonds[j].y == new_ok_diamonds[i].y){
        is_new_diamond = false;
        break;
      }
    }
    if (is_new_diamond){//не нашли в старом списке алмаза с такими координатами
      all_diamonds_are_stable = false;
      break;
    }         
  } 

  var all_prev_ok_diamonds_are_ok = true;
  for (var i = 0; i < ok_diamonds.length; ++i){
    var x = ok_diamonds[i].x;
    var y = ok_diamonds[i].y;

    if (new_diamonds.findIndex(p => p.x == x && p.y == y) == -1) continue; //его съели

    var is_ok = false;
    for (var j = 0; j < new_ok_diamonds.length; ++j){
      if (new_ok_diamonds[j].x == ok_diamonds[i].x && new_ok_diamonds[j].y == ok_diamonds[i].y){
        is_ok = false;
        break;
      }
    }

    if (!is_ok){
      all_prev_ok_diamonds_are_ok = false;
      break;
    }

  }


  //координаты алмазов изменились или появились новые доступные или старые доступные стали недоступными
  if (!all_diamonds_are_stable || !all_prev_ok_diamonds_are_ok){ 
    // console.log("\nUPDATE TSP!!!!");
    initData();
    shortest_path = build_tsp_way(new_ok_diamonds,self, graph,screen);   
  } 
  // else if (is_new_ok_targets(new_ok_diamonds, graph, start)){ //координаты не изменились, но некоторые стали доступными
  //   //console.log("\nNEW TARGETS!!!!");
  //   initData();
  //   shortest_path = build_tsp_way(new_ok_diamonds,self, graph,screen);   
  // } 
  else if (new_diamonds.length < all_diamonds.length){  //число всех алмазов умееньшилось - мы собрали 1   

    var diamond = points[best[tsp_index]];   
    var is_planed = self.x == diamond.x && self.y == diamond.y;

    if (is_planed){
      // console.log("\nLESS DIAMONDS - PLANED!!!!");   
      traversed.push(tsp_index);     

      //1 подход - после взятия алмаза пересчитываем направление - идем к ближайшему
      calc_tps_direction(tsp_index, self, graph);     
  
      
      //2 подход - сохраняем направление
      // if (is_forward_tsp){   
      //   while(traversed.indexOf(tsp_index) > -1){   
      //     tsp_index = tsp_index < best.length - 1 ? tsp_index + 1 : 0;    
      //   }
      // }
      // else{
      //   while(traversed.indexOf(tsp_index) > -1){   
      //     tsp_index = tsp_index > 0 ? tsp_index - 1 : best.length - 1;   
      //   }
      // }

     
    }
    else{
      //console.log("\nLESS DIAMONDS - RANDOM!!!!");   
     
      var random_diamond_index = points.findIndex(p => p.x == diamond.x && p.y == diamond.y);
      var random_tsp_index = best.indexOf(random_diamond_index);
      traversed.push(random_tsp_index);
      //calc_tps_direction(tsp_index, self, graph);   

      
      // ok_diamonds = new_ok_diamonds;      
      // all_diamonds = new_diamonds;
      // initData();  
      // shortest_path = build_tsp_way(new_ok_diamonds, self, graph, screen);
      // return shortest_path;

    } 
    
    var diamond = points[best[tsp_index]];   
    var end = graph.grid[diamond.x][diamond.y];
    shortest_path = astar.search(graph, start, end);   
   
  }
  else{ //с алмазами ничего не произошло. двигаемся дальше
    var diamond = points[best[tsp_index]];   
    var end = graph.grid[diamond.x][diamond.y];
    shortest_path = astar.search(graph, start, end);
  }
 
  ok_diamonds = new_ok_diamonds;  
  all_diamonds = new_diamonds;
  
  return shortest_path;
}


function get_ok_targets(targets, start, graph){
  var ok_targets = [];
  
  targets.forEach(function(target) {
    if (graph.grid[target.x][target.y].weight == 0) return;
    var end = graph.grid[target.x][target.y];
    var path = astar.search(graph, start, end);
    if (path.length == 0) return;
  
    ok_targets.push(target);
  }, this); 
  return ok_targets; 
}


function get_min_kill_stone(butt_pathes, butt_kill_stones, self, graph){
  var min_time = 999999;
  var min_kill_stone = undefined;
  let butt_pathes_index = -1;
  for (let i =0; i < butt_pathes.length; ++i){

    let butt = butt_pathes[i][0];
    let index = butt_dirs.findIndex(bd => get_manhatten_dist(butt.x, butt.y, bd.x, bd.y) <= 1);
    if (butt_dirs[index].is_ignored) continue;
    
    let path = butt_pathes[i];

    var def_index = butt_kill_stones[i].findIndex(bks => bks != undefined);
    //console.log(butt_kill_stones[0]);

    if (def_index == -1){
      continue;
    }      
   
    var kill_stone = get_butt_kill_min_time_stone(butt_kill_stones[i], path, self, graph);
    
    if (kill_stone != undefined && kill_stone.time < min_time){

      //console.log("time: " + kill_stone.time);

      min_time = kill_stone.time;
      min_kill_stone = kill_stone;
      min_kill_stone.butt_pathes_index = i;
      //console.log("\n" + kill_stone.stone.x + " " + kill_stone.stone.y+ "                     ");
    }
    else{
      //console.log("\nundefined tmp stone                              ");
    }
  
  }

 

  return min_kill_stone;
}


function set_exploded_butts_weight(graph){
  for (let i = explosion_zones.length - 1; i >=0; --i){
    var ez = explosion_zones[i];

    if (++ez.stage > 3){
       explosion_zones.splice(i, 1);
    }
    else{
      for (let j = 0; j < 3; ++j){
        for (let k = 0;k < 3; ++k){
          graph.grid[ez.start_x + j][ez.start_y + k].weight = 0;
        }
      }
    }

   
  }
}


//function play(screen){
exports.play = function*(screen){
    while (true){	    
    
    //console.log("\nOK!");
    
     

    screen_height = screen.length - 1;
  
    let self = find_targets('A',screen)[0];    
  

    var graph = init_graph(screen, self);
    let start = graph.grid[self.x][self.y];
    set_movable_stones_weight(screen, self, graph);   
    

    var diamonds = find_targets('*', screen);
    set_trap_diamonds(diamonds, screen, graph); 
        
    //Чтобы на нас не упал камень
    let falling_stones = afraid_of_stones_and_diamonds(screen, graph, self.x, self.y);
 
    
    //боимся бабочек
    var butts = find_targets('/|-\\', screen);

    if (butts.length > 0 && butt_dirs.length == 0){
      butts.forEach(function(butt) {
        butt_dirs.push({x:butt.x, y:butt.y, dir:UP, is_ignored:false});
      }, this);
    }

    //удаляем butt_dirs убитых бабочек
    for (let i = butt_dirs.length - 1; i >= 0; --i){
      let bd = butt_dirs[i];
      var index = butts.findIndex(b => get_manhatten_dist(b.x, b.y, bd.x, bd.y) <= 1);
      if (index == -1){//эту бабочку убили
        butt_dirs.splice(i, 1);
      }
    }

    var butt_pathes = [];    
    for (var i = 0; i < butts.length; ++i){
      var butt = butts[i];
      let b_path = [];

      var index = butt_dirs.findIndex(bd => get_manhatten_dist(butt.x, butt.y, bd.x, bd.y) <= 1);
      if (index == -1){
        console.log("\nbutt_dirs not found");
        throw "";
      }
      
      get_butt_path({x: butt.x, y: butt.y, dir: butt_dirs[index].dir}, screen, b_path);
     
      butt_dirs[index].x = butt.x; 
      butt_dirs[index].y = butt.y; 
      butt_dirs[index].dir = b_path[1].dir; 
    
      butt_pathes.push(b_path);       
    }

    //afraid_of_butterfly(screen, graph, self, butts, butt_graph);
   
   
    // for (var i = 0; i < butt_pathes[0].length; ++i){
    //   console.log(butt_pathes[0][i].x + " " + butt_pathes[0][i].y + " " + butt_pathes[0][i].dir);
    // }

    set_exploded_butts_weight(graph);
    
    afraid_of_explotion(butt_pathes, falling_stones, self, graph);    

    afraid_of_butterfly(butt_pathes, graph, self);

    //  console.log("\n");    
    // for (let i = 0; i<screen_height; i++){
    //   var res ="";
    //   for (let j = 0; j<screen[i].length; j++) {
    //     if (self.x == i && self.y == j){
    //       res += "A";
    //     }
                  
    //     else {
    //       res += graph.grid[i][j].weight;
    //     }
      
    //   }
    //   console.log(res);
    // }		 

     

   
    var butt_kill_stones = get_butt_kill_stones(butt_pathes, screen, graph); 
    
    // var ppp = butt_pathes[1];
    //  let path_str = "";
    //   for (let i = 0; i < ppp.length; ++i){
    //     path_str += ppp[i].x + "," + ppp[i].y + " ";  
    //   }
    //   console.log("\n"+path_str+"\n");    

   
    let min_kill_stone = get_min_kill_stone(butt_pathes, butt_kill_stones, self, graph);



   
     


    // if (min_kill_stone != undefined){
    //   console.log("\n\nResult stone: "+min_kill_stone.stone.butt_x + " " + min_kill_stone.stone.butt_y+"                      ");
    //   //console.log("self: " + self.x + " " + self.y + "                        ");
    // }
    // else {
    //   console.log("\n\nstone is undefined                                   ");
    // }
   
    let is_leaving = false;
    let is_up = false;
    let is_waiting = false;
        
    var is_up_stone = min_kill_stone != undefined && min_kill_stone.stone.y == min_kill_stone.stone.butt_y;
    var is_left_stone = min_kill_stone != undefined && min_kill_stone.stone.y < min_kill_stone.stone.butt_y;
    var is_right_stone = min_kill_stone != undefined && min_kill_stone.stone.y > min_kill_stone.stone.butt_y;
    let is_side_stone = is_left_stone || is_right_stone;  


    if (is_up_stone && self.x == min_kill_stone.stone.x + 1 && self.y == min_kill_stone.stone.y 
      || is_side_stone && self.x == min_kill_stone.stone.x && self.y == min_kill_stone.stone.butt_y){
        
      //console.log((butt_kill_stone.step_time - 1) + " " + (butt_kill_stone.time - 1));

      //console.log(min_kill_stone.step_time + " " + min_kill_stone.time + "                        ");

      if (min_kill_stone.step_time < min_kill_stone.time){//валим отсюда
        //TODO: сделать остальные точки butt_x проходимыми
        //console.log("\nVALIM                          ");
        is_leaving = true;
        
        
        let butt = butt_pathes[min_kill_stone.butt_pathes_index][0];
        let index = butt_dirs.findIndex(bd => get_manhatten_dist(butt.x, butt.y, bd.x, bd.y) <= 1);
        butt_dirs[index].is_ignored = true;        
       
        min_kill_stone = get_min_kill_stone(
          butt_pathes, butt_kill_stones, self, graph);
         
      }
      else {
         //console.log("\nwait for leaving");
        //console.log(min_kill_stone.path_x + " " + min_kill_stone.path_y);
        //kill_stone.step_time--;//бабочка приближается
        is_waiting = true;
      }
      
    }
    else if (min_kill_stone != undefined && self.x == min_kill_stone.stone.butt_x && self.y == min_kill_stone.stone.butt_y){
        //console.log("going up\n");
      is_up = true;     
    }
    
   
    if (is_waiting){      
      yield '';
      continue;
    }
    else if (is_up){      
      yield 'u';
      continue;
    }
    else if (is_leaving){ 
      graph.grid[self.x+1][self.y].weight = 0;
     
      if (is_up_stone){
        graph.grid[self.x-1][self.y].weight = 0; //чтобы не съел алмаз
      }
      else if (is_left_stone){
        graph.grid[self.x][self.y-1].weight = 0; //чтобы не съел алмаз
      }
      else if (is_right_stone){
        graph.grid[self.x][self.y+1].weight = 0; //чтобы не съел алмаз
      }
      else{
        console.log("What stone?");
        throw("What stone?");
      }
      
    } 

   

    //console.log(butt_kill_stone.stone.butt_x + " " + butt_kill_stone.stone.y);
    
     
    //console.log("\n" + kill_stone.stone.butt_x + " " + kill_stone.stone.y + " " +  kill_stone.time);
     
    
    //var butt_kill_path = get_butt_kill_path(butt_kill_stones, self, graph, screen);

    // var last = butt_kill_path[butt_kill_path.length - 1];
    //  console.log("\n" + last.x + " " + last.y);

    // butt_kill_stones.forEach(function(bks) {
    //  console.log(butt_kill_path.x + " " + butt_kill_path.y);  
    // }, this);


    var shortest_path = undefined;
    //сначала открываем бабачек
    //shortest_path = get_shortest_path(self, close_butts, graph, false);

    //сначала убиваем бабочек
    if (min_kill_stone != undefined){
      set_targets_weight(diamonds, graph, 0);
      let end = graph.grid[min_kill_stone.stone.butt_x][min_kill_stone.stone.butt_y];
      end.weight = 1;
      shortest_path = astar.search(graph, start, end);
      
    }

    //потом открываем закрытых бабочек
    if (shortest_path == undefined){
     
      let closed_butts = [];
      butts.forEach(function(butt) {
        let is_closed_butt = is_closed_butt_tmp(screen, butt.x, butt.y, []);
        if (is_closed_butt){
          closed_butts.push(butt);
        }
      }, this);

      if (closed_butts.length > 0){
        set_targets_weight(diamonds, graph, 0);
      }

      let min_dist = 999999;
      let min_dist_path = undefined;
      closed_butts.forEach(function(cb) {
        let end = graph.grid[cb.x][cb.y];
        let cb_path = astar.search(graph, start, end);
        if (cb_path.length > 0 && cb_path.length < min_dist){
          min_dist = cb_path.length;
          min_dist_path = cb_path;
        }
      }, this);
      shortest_path = min_dist_path;

      
    }
    
    
   

   //потом ищем алмазы
    if (shortest_path == undefined){
      
      var ok_diamonds = get_ok_targets(diamonds, self, graph);

      if (ok_diamonds.length >= 2){
        shortest_path = get_path(diamonds, ok_diamonds, self, screen, graph);        
      
      }
      else if(ok_diamonds.length == 1){
        var ok_diamond = ok_diamonds[0];
        shortest_path = astar.search(graph, start, graph.grid[ok_diamond.x][ok_diamond.y]);
      }    
      
    }
         
    
    if (shortest_path == undefined){
      //console.log("\nNo appropriate diamonds 1");    
      
      
      //потом ище пути, чтобы убить бабочек
      //shortest_path = get_path_to_kill_butt(butts, screen, graph, self);     

      //потом жрем ближайшую землю
      
      if (butts.length == 0){//бабочек нет, а алмазов либо нет, либо недоступны
        var x = 1;
        var y = 1;          
        
        while (shortest_path == undefined){
          let end = graph.grid[x][y];
          if (end.weight == 0){
            y++;
            continue;
          } 
          let path = astar.search(graph, start, end);
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


    
    


    var move= '';
    if (shortest_path != undefined && shortest_path.length > 0){

      var first_step = shortest_path[0];
      // if (shortest_path.length == 0){ //нас зажали
      //   console.log("\nнас зажали!!!!!!!!!!!!!!");       
        
         
      // for (let i = 0; i<screen_height; i++){
      //   var res ="";
      //   for (let j = 0; j<screen[i].length; j++) {
      //     if (self.x == i && self.y == j){
      //       res += "A";
      //     }
                    
      //     else {
      //       res += graph.grid[i][j].weight;
      //     }
        
      //   }
      //   console.log(res);
      // }		 
        
    
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






























//A*
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





//TSP
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

  if (UNCHANGED_GENS == 50){
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







//INITIAL DATA
var stones = [];
var screen_height = 0;
var is_tsp_data_initialized = false;
var tsp_index = undefined;

var all_diamonds = [];
var ok_diamonds =[];
var is_forward_tsp = true;
var traversed = [];

var butt_dirs=[];

let explosion_zones = [];

let counter = 0;


//  var screen = 
//  ["A     ", 
//   " :::: ",
//   " :/ : ",
//   " :: : ",
//   "   + *"]; 

// var screen =  ["########################################",
//         "#:+   :*  :+::  +:O:O::++:: *  ::+  :++#",
//         "# :+::  + ::O::O:: : :::O+ :: :::*:: O+#",
//         "#:::::::::/  :O:*::O:::+O*O:O:+:: :O  :#",
//         "#:* ::O:+   ::::::  ::::* +: *+: * :O: #",
//         "#:++  ::::+* ::O/ +:+   O * *::   : ++:#",
//         "#O ::+*:+:+O :::  O:+:: :::* :*O:O ::::#",
//         "#: :::O:::::: :: : O  * :+ :: + : ::O: #",
//         "#:+O+::+:+:: :::++::: ::O::::+:+O  :+::#",
//         "#::::::::O:O*: ::OO::O::  O++::+:    +*#",
//         "#O:OO+: ::OOO*:++:O+::::*:*: : :::+ :: #",
//         "#  : :*::+  O::O :::::  +O*  :: :+ ::  #",
//         "# *::+::: : O: ::+::  :O :: :O+:::+:: *#",
//         "#:: +:O: O:+:+ :: : *:: :O::::  :::::OO#",
//         "#:::O:+:::*::+:: :O* ::O O  : ::*++* : #",
//         "#+:*:O: ::  :::+: O: ::**:O + : :+:O:O:#",
//         "#+:* : ::O:++: *::+: :: ++ :+::+::*:OO:#",
//         "# : :: :: :O :::   *:  :O: ::: ::O: +: #",
//         "#::*:  ::O++:: ::O+::O  :::: :::::::O::#",
//         "#O+ O+ : O::O:::*:  O: :/ :*: ::::  :++#",
//         "#::+:++::O + O:: :: +O+    :::A   :: ::#",
//         "########################################"];
 
//  play(screen);



