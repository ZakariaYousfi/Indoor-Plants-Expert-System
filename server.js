const express = require('express');
const app = express();
const cors = require('cors')
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const JSONParser = require('json-parse-async');

app.use(cors())
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let fired = new Map()
let memory


app.get('/api/bases', async (req, res) => {
    console.log('tethered')
  try {
    const baseFileName = req.query.base || 'base.json';
    const filePath = path.join(__dirname, '/bases', baseFileName);
    const baseJSON = await fs.promises.readFile(filePath, 'utf8');
    const base = JSON.parse(baseJSON);
    res.status(200).send({ "bases list": ["base.json"],base});
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/api/bases', async (req, res) => {
  console.log("fethered")
  try {
    const baseFileName = req.body["base"]
    let memoryJSON = req.body["memory"]
    console.log(memoryJSON)
    let memory = new Map()
    const resourcePath = path.join(__dirname, 'bases/' + baseFileName);
    const baseJSON = await fs.promises.readFile(resourcePath, 'utf8');

    const base = JSON.parse(baseJSON);
    let targetVariable = base["target"];


    let knowledgeBase = base["knowledge base"]

    memoryJSON.forEach((elm) => {
      memory.set(elm.variable,elm)
    })


    let log = '[';
    fired = new Map() 
    selectedRule = 'selectedRule'
    let cpt = 0
    while (true) { 
      if (memory.get(targetVariable).value!="" && cpt!=0) {
        log += '{"type" : "target found"}';
        break;
      } else if (selectedRule == null) {
        log += '{"type" : "no rule"}';
        break;
      } else {
        cpt++    
      let {conflictSet,selectedRule} = infer(knowledgeBase,fired,memory)
        let result = '' 
        let i = 0;
        const confSetIterator = conflictSet.values()
        while (i < conflictSet.size - 1) {
          result+=confSetIterator.next().value.label+', ';
          i++;
        }
        result += confSetIterator.next().value.label
        
        log += `{"type" : "step", "conflict set" : "${result}", "selected rule" : "${selectedRule.label}"},`;
      }      
    }

    log += ']';
    let finalValues = '[';

    for (const [key, value] of memory.entries()) {
      finalValues += `{"variable":"${value.variable}","value":"${value.value}"},`;
    }
    finalValues = finalValues.slice(0, -1) + ']';

    const responseJSON = `{"log":${log},"memory":${finalValues}}`;
    console.log(responseJSON)
    res.status(200).send(responseJSON);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
  
});

function infer(knowledgeBase,fired,memory){
  let conflictSet = new Map()
  knowledgeBase.forEach((rule)=>{
    if(!fired.get(rule.label)){
    let ants = rule.antecedents
    let nb = 0
    memory.forEach((key,value,map)=>{ 
      if(key.value!=''){
        ants.forEach((elm)=>{
          if(elm["variable"]==key.variable && elm["value"] == key.value){
            nb++;
          }
        })
      }
    })
    if(nb == ants.length) conflictSet.set(rule.label,rule)
  }
  })
  let max = 0;
  let selectedRule = null;
  for (let rule of conflictSet) {
    if (
      rule[1].antecedents.length > max
    ) {
      max = rule[1].antecedents.length;
      selectedRule = rule[1];
    }
  }
  if(selectedRule!=null){
    fired.set(selectedRule.label,selectedRule)
    memory.set(selectedRule["consequent"]["variable"],{variable:selectedRule["consequent"]["variable"],value:selectedRule["consequent"]["value"]})
  }
  return {conflictSet,selectedRule}

}
  
  

const port = 5000

app.listen(5000,() => console.log('listening in port ' + port))