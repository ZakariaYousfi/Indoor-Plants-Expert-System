import React from 'react';
import { useState, useEffect } from 'react';

const App = () => {

    const [state,setState] = useState({
        "base" : {},
        "base name" : "base.json",
        "bases list" : [],
        "log" : []
    });

    useEffect(() => {
        const url = "http://localhost:5000/api/bases";

        fetch(url, {
            method : 'GET'
        })
        .then(response => response.json())
        .then(data => {
            setState(state => ({...state,...data}));
            console.log("data")
            console.log(data)
        })
        .catch(error => console.log(error));
    },[])

    const handleForward = () => {
        document.getElementById("forward-button").disabled = true;

        let request = {
            "base" : state["base name"],
            "memory" : []
        };

        state["base"]["variables"].forEach(variable => {
            const name = variable["name"];
            const select = document.getElementById(name + "-select");
            const value = select.options[select.selectedIndex].value;
            request["memory"].push({
                "variable" : name,
                "value" : value
            });
        });

        const url = "http://localhost:5000/api/bases";
        console.log(request)
        fetch(url, {
            method : 'POST',
            headers: {'Content-Type': 'application/json'},
            body : JSON.stringify(request)
        })
        .then(response => response.json())
        .then(data => {
            console.log("dataa")
            console.log(data)
            let new_base = state.base;
            new_base.memory = data.memory;
            setState({...state,
                log : data.log,
                base : new_base
            }, () => {
                document.getElementById("forward-button").disabled = false;
            });
        })
        .catch(error => console.log(error));
    }

    const handleBaseChange = () => {
        const select = document.getElementById("base-select");
        const selectedBase = select.options[select.selectedIndex].value
        if (selectedBase !== "") {
            const url = "/api/bases?base=" + selectedBase;

            fetch(url, {
                method : 'GET'
            })
            .then(response => response.json())
            .then(data => {
                data["base name"] = selectedBase;
                data["log"] = [];
                setState(...state,data);
            })
            .catch(error => console.log(error));
        }
    }

    return (
            <div className=" bg-secondary bg-opacity-10">
                <div className="page-header bg-dark py-2 ps-4">
                    <div className="d-inline-flex">
                        <img className="me-2" src="/icon.png" width="50" height="50" alt="" />
                        <h1 className="text-white">
                            Expert System
                        </h1>
                    </div>
                    <h4 className="text-muted">Current knowledge base - <em className="">{state["base name"]}</em> -</h4>
                </div>
                <div className="container">
                    <div className="row g-2">
                        <div className="col-md-7">
                            <div className="bg-secondary bg-opacity-25 rounded-3 p-2 my-2">
                                <KnowledgeBase rules={state.base["knowledge base"]} />
                            </div>
                            <div className="bg-secondary bg-opacity-25 rounded-3 p-2 my-2">
                                <Controls basesList={state["bases list"]}
                                    onForward={handleForward}
                                    onBaseChange={handleBaseChange} />
                            </div>
                        </div>
                        <div className="col-md">
                            <div className="bg-secondary bg-opacity-25 rounded-3 p-2 my-2">
                                <Variables variables={state.base["variables"]} memory={state.base["memory"]} /> 
                            </div>
                            <div className="bg-secondary bg-opacity-25 rounded-3 p-2 my-2">
                                <Log log={state.log} result = {state.base.memory ? 'Plant : ' + state.base.memory[1].value : 'no deductions yet'} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="page-footer py-3 text-center">
                    Ayoub Hammal | Mohamed Ait Amara
                </div>
            </div>
        );
    }


const Controls = (props) => {
    const handleForward = () => {
        props.onForward()
    } 
    const handleBaseChange = () => {
        props.onBaseChange()
    }
    if (props.basesList) {
            const options = props.basesList.map((base) => {
                return (
                    <option value={base}>{base}</option>
                );
            });
            return (
                <div>
                    <div>
                        <button className="btn btn-dark btn-sm btn-outline-light" id="forward-button" onClick={handleForward}>Forward Chaining</button>
                    </div>
                    <div className="form-floating">
                        <select className="form-select" id="base-select" onChange={handleBaseChange}>
                            <option value="" selected="selected">-- Knowledge Bases --</option>
                            {options}          
                        </select>
                        <label htmlFor="base-select">Select a knowledge base</label>
                    </div>
                </div>
            );
        } else {
            return (
                <div></div>
            );
        }

}
const Log = (props) => {

    let log = null;
    let placeholder = (<tr><td colSpan={3}>No results yet</td></tr>);
    if (props.log && props.log.length > 0) {
        let stepId = 0;
        log = props.log.map(step => {
            stepId = stepId + 1;
            if (step["type"] === "target found") {
                return (<>
                    <tr>
                        <td>{stepId}</td>
                        <td colSpan={2}>Target variable found</td>
                    </tr>
                    <tr>
                        <td>{stepId+1}</td>
                        <td colSpan={2}>{props.result}</td>
                    </tr>
                    </>
                );
            } else if (step["type"] === "no rule") {
                return (
                    <tr>
                        <td>{stepId}</td>
                        <td colSpan={2}>No rule can be applied</td>
                    </tr>
                );
            } else if (step["type"] === "step") {
                return (
                    <tr>
                        <td>{stepId}</td>
                        <td>{step["conflict set"]}</td>
                        <td>{step["selected rule"]}</td>
                    </tr>
                );
            } else {
                return (
                    <tr></tr>
                );
            }
            
        });
    }
    return (
        <div className="py-3">
            <h2>Results</h2>
            <table className="table table-striped table-bordered table-dark table-responsive align-middle">
                <thead className="table-light">
                    <tr>
                        <th>Step</th>
                        <th>Conflict Set</th>
                        <th>Selected Rule</th>
                    </tr>
                </thead>
                <tbody>
                    { props.log && props.log.length > 0 ? log : placeholder}
                </tbody>
            </table>
        </div>
    );
}
const Variables = (props) => {
    if (props.variables) {
        const memory = groupBy(props.memory, "variable", "value");

        const variablesInputs = props.variables.map((variable) => {
            const name = variable["name"];
            const values = variable["values"];
            return (
                <div>
                    <VariableInput name={name} values={values} selected={memory[name]}/>
                </div>
            );
        });
        return (
            <div>
                <h2>Variables</h2>
                <div>
                    {variablesInputs}
                </div>
            </div>
        );
    } else {
        return (
            <div>
            </div>
        );
    }
}
const VariableInput = (props) => {
    if (props.values) {
        const options = props.values.map((value) => {
            return (
                <option value={value} selected={props.selected === value}>{value}</option>
            );
        });
        return (
            <div className="form-floating">
                <select className="form-select" id={props.name + "-select"} aria-label="Floating label select example">
                    <option value=""></option>
                    {options}
                </select>
                <label htmlFor={props.name + "-select"}>{props.name}</label>
            </div>
        );
    } else {
        return (
            <fieldset>
            </fieldset>
        );
    }
}

const KnowledgeBase = (props) => {
    let rules = null;
    if (props.rules) {
        rules = props.rules.map((rule) => {
            const label = rule["label"];
            const antecedents = rule["antecedents"].map((clause) => {
                return Object.values(clause).join(" ");
            }).join(" AND ");
            const consequent = Object.values(rule["consequent"]).join(" ");

            return (
                <tr>
                    <td>{label}</td>
                    <td>{antecedents}</td>
                    <td>{consequent}</td>
                </tr>
            );
        });
    }
    return (
        <div>
            <h2>Knowledge Base</h2>
            <table className="table table-striped table-bordered table-dark table-responsive align-middle">
                <thead className="table-light">
                    <tr>
                        <th>Label</th>
                        <th>Antecedents clauses</th>
                        <th>Consequent clause</th>
                    </tr>
                </thead>
                <tbody>
                    {props.rules ? rules : "No rules to display"}
                </tbody>
            </table>
        </div>
    );
}

function groupBy(list, key, value) {
    const map = {};
    list.forEach((item) => {
        const k = item[key];
        const v = item[value];
        map[k] = v;
    });
    return map;
}

export default App;