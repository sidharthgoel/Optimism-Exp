//not being used - will come back and fix

function execute(){
  // Dynamic variables - remember that any changes here need to also be reflected in test_run_block! (and also data.write)
  var money = 100000
  var timestep = 0
  var curr_stage = 0
  var most_recent_action = ""
  var most_recent_money = 0
  var condition = "pessimism" //you can have "optimism", "realism", or "pessimism" here

  // Static variables
  var actions = {73: "invest", 77: "market"}
  var product_stages = [0.6, 0.7, 0.7] //transition matrix - index is prod stage, prob is chance of remaining in curr stage
  var num_stages = product_stages.length
  var goal_timesteps = [5, 12] //list of important timesteps, in ascending order
  var last_timestep = goal_timesteps[goal_timesteps.length -1]
  var invest_mean = -300    //mean and variance for reward upon investing
  var invest_variance = 20
  var market_mean = (curr_stage + 1) * 1000;  //mean and variance for reward upon marketing - should be a function of curr_stage
  var market_variance = (curr_stage + 1) * 100;
  var test_timesteps = 3 //how many time steps 
  var test_timestep_tracker = 0 //internal timer, don't modify
  var money_points = [] //for graph display

  var condition_probs = {"optimism": 1.1, "realism": 1, "pessimism": 0.9} //can adjust level of optimism and pessimism
  var transition_prob_scaling = condition_probs[condition]
  var primed_condition = condition //

  /* intial instructions, before test run */
  var phase1_instructions = {
    type: "text",
    text: "<p>You are working for a company and are tasked with deciding whether "+
          "to <b>invest</b> in your product or <b>market</b> it.</br> "+
          "By investing, your product <i>improves</i>* with some probability, but "+
          "immediate rewards are negative. By marketing, your product remains as is, " +
          "but rewards** are positive.</p>"+
          "<p>* An improved product means that marketing it later will give you a higher reward.</p>"+
          "<p> **The reward is variable, not fixed.</p>"+
          "<p> The goal is to maximize your money by the end of the game.</p>"+
          "<p>In this phase, you will simply get a feel for the experiment, " +
          "by selecting 'I' to Invest or 'M' to Market.</p>" + "<p>You begin with $" + money +".</p>",
    cont_key: [73, 77],
    //timing_post_trial: 2000
  };

  /* instructions before actual experiment */
  var phase2_instructions = {
    type: "text",
    text: "<p>Now that you have understood the experiment, " +
          "proceed to the actual experiment (phase 2) by investing (I) or marketing (M).</p>" +
          "<p>Again, you begin with $" + money +".</p>",
    cont_key: [73, 77],
    //timing_post_trial: 2000
  };

  var prod0_phase = {
    type: "text",
    text: function() {
          var product_stage_message = ""
          if (actions[getMostRecentKey()] == 'invest'){
            product_stage_message = "Your product is now at stage " + curr_stage;
          }
          if (actions[getMostRecentKey()] == 'market'){
            product_stage_message = "Your product remains at stage " + curr_stage;
          }
          var trial_data = {
              money: money,
              curr_stage: curr_stage,
              action: most_recent_action,
              reward: most_recent_money,
              timestep: timestep,
              condition: primed_condition,
          }

          return "<p>You decide to <b>"+ actions[getMostRecentKey()] + "</b>.</p>" +
          "<p>This returns a profit of $" + getMoney() + ", for a current total of $" + updateMoney() + ".</p>" +
          "<p>"+ product_stage_message+ "</p>" +
          "<div style='display:none;'>" + jsPsych.data.write(trial_data) + "</div>"+ //cleaner way to do this?
          "<footer>Date: " + getMonthYear() +"</footer>";

        },
    cont_key: [73, 77],

  };

  var prod0_test_phase = {
    type: "text",
    text: function() {
          var product_stage_message = ""
          var original_stage = curr_stage
          var gottenMoney = getMoney()
          var updatedMoney = updateMoney()
          if (actions[getMostRecentKey()] == 'invest'){
            product_stage_message = "your product is now at stage " + curr_stage;
          }
          if (actions[getMostRecentKey()] == 'market'){
            product_stage_message = "your product remains at stage " + curr_stage;
          }
          curr_stage = original_stage //IMPORTANT: reset
          return "<p>You decide to <b>"+ actions[getMostRecentKey()] + "</b>, and " + product_stage_message + ".</p>" +
          "<p>This returns a profit of $" + gottenMoney + ", for a current total of $" + updatedMoney + ".</p>" +
          "<p>Product stage: "+ curr_stage+ "</p>" +
          "<footer>Date: " + getMonthYear() +"</footer>";

        },
    cont_key: [73, 77],

  };

  var prod0_test_feedback = {
    type: "text",
    text: function() {
      return "<button>click</button>"
    }
  };

  var test_run_chunk = {
      chunk_type: 'while',
      timeline: [prod0_test_phase,],
      continue_function: function(){
          if (curr_stage == num_stages-1 && test_timestep_tracker == test_timesteps-1){ //subtract by 1 because of start at 0
            return false;
          }

          else { 
            if(test_timestep_tracker == test_timesteps-1){
              test_timestep_tracker = 0
              curr_stage += 1 
            }else{
                test_timestep_tracker +=1
            }
            console.log(test_timestep_tracker)
            return true; 
          }
      }
  }

  // resets all variables that were changed in the test run, for the actual run
  var reset_block = {
    type: 'call-function',
    func: function(){ 
      money = 100000
      timestep = 0
      curr_stage = 0
      most_recent_action = ""
      most_recent_money = 0
      condition = "realism"
      transition_prob_scaling = condition_probs["realism"] 
      money_points = []
    }
  };

  var live_run_chunk = {
      chunk_type: 'while',
      timeline: [prod0_phase],
      continue_function: function(){
          timestep +=1
          if(timestep >= goal_timesteps[goal_timesteps.length-1]) {
            return false; 
          }
          else { return true; }
      }
  }

  var graph_block = {
    type: 'call-function',
    func: function(){
      var ctx = document.getElementById("myChart").getContext("2d");
      var data = {
        labels: Array.apply(null, {length: last_timestep}).map(Number.call, Number),
        datasets: [
            {
                label: "Performance",
                fillColor: "rgba(220,220,220,0.2)",
                strokeColor: "rgba(220,220,220,1)",
                pointColor: "rgba(220,220,220,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(220,220,220,1)",
                data: money_points
            },
        ]
      };
      var myLineChart = new Chart(ctx).Line(data);
    }
  }

  var debrief_block = {
    type: "text",
    text: function() {
      return "<p>Thank you for your time!</p>";
    }
  };

  //Consent form
  var check_consent = function(elem) {
      if ($('#consent_checkbox').is(':checked')) {
          return true;
      }
      else {
          alert("If you wish to participate, you must check the box next to the statement 'I agree to participate in this study.'");
          return false;
      }
      return false;
  };        
  var consent_form = {type:'html', pages: [{url: 'consent.html', cont_btn: "start",check_fn: check_consent}]};

  function getMostRecentKey(){
    var trials = jsPsych.data.getTrialsOfType('text');
    var most_recent_trial = trials[trials.length - 1]
    if (typeof(most_recent_trial) == "undefined"){
      return ""
    }
    most_recent_action = actions[most_recent_trial['key_press']]
    return most_recent_trial['key_press'];

  }

  //Returns money for specific action
  function getMoney(){
    if(most_recent_action == "invest"){
      var random_num = Math.random() * transition_prob_scaling
      if(random_num > product_stages[curr_stage]){ //updates current stage, with probability
        if(curr_stage < num_stages){
          curr_stage +=1
        }
      }
      most_recent_money = normal_random(invest_mean, invest_variance); //returns reward
    }
    if(most_recent_action == "market"){    //returns reward based on current stage of product
      most_recent_money = normal_random(market_mean, market_variance);
    }
    return most_recent_money;
  }

  //Returns total amount of money after taking action
  function updateMoney(){
    money += most_recent_money
    money_points.push(money)
    return money;
  }

  function getMonthYear(){
    var day = new Date()
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    var month = months[Math.floor(day.getMonth() + timestep)%12]
    var year = day.getFullYear() + Math.floor((timestep+day.getMonth())/12)
    return month + " " + year
  }

  //Returns normally distributed values
  function normal_random(mean, variance) {
    if (mean == undefined)
      mean = 0.0;
    if (variance == undefined)
      variance = 1.0;
    var V1, V2, S;
    do {
      var U1 = Math.random();
      var U2 = Math.random();
      V1 = 2 * U1 - 1;
      V2 = 2 * U2 - 1;
      S = V1 * V1 + V2 * V2;
    } while (S > 1);

    X = Math.sqrt(-2 * Math.log(S) / S) * V1;
    X = mean + Math.sqrt(variance) * X;
    return Math.round(X);
  }

  // defining the experiment
  var experiment = [];
  experiment.push(consent_form);
  experiment.push(phase1_instructions);
  experiment.push(test_run_chunk);
  experiment.push(reset_block);
  experiment.push(phase2_instructions);
  experiment.push(live_run_chunk);
  //experiment.push(graph_block);
  experiment.push(debrief_block);

  jsPsych.init({
    display_element: $('#jspsych-target'),
    experiment_structure: experiment,
    // on_finish: function() {
    //   jsPsych.data.displayData();
    //   var data_as_csv = jsPsych.data.dataAsCSV();
    // }
  });
}