"use strict"

class NeuralNetwork{
    constructor(numInputs , numHidden , numOutputs) {
        this._numInputs = numInputs;
        this._numHidden = numHidden;
        this._numOutputs = numOutputs;
        this._weights0 = new Matrix(this._numInputs , this._numHidden);
        this._weights1 = new Matrix(this._numHidden , this._numOutputs);

        //randomise the initial weights
        this._weights0.randomWeights();
        this._weights1.randomWeights();
    }

    get weights0(){
        return this._weights0;
    }

    set weights0(weights) {
        this._weights0 = weights;
    }

    get weights1(){
        return this._weights1;
    }

    set weights1(weights) {
        this._weights1 = weights;
    }

    feedForward(inputArray){
        //convert input array to a matrix
        let inputs = Matrix.convertFromArray(inputArray);
        console.log("inputs");
        console.table(inputs.data);

        //find the hidden values and apply the activation function
        let hidden = Matrix.dot(inputs, this.weights0);
        console.log("hidden");
        console.table(hidden.data);
        hidden = Matrix.map(hidden, x => sigmoid(x));
        console.log("hiddenSig");
        console.table(hidden.data);

        //find the output values and apply the activation function
        let outputs = Matrix.dot(hidden, this.weights1);
        console.log("outputs");
        console.table(outputs.data);
        outputs = Matrix.map(outputs, x => sigmoid(x));
        console.log("outputsSig");
        console.table(outputs.data);

        return outputs;

        //apply bias???
    }
}

function sigmoid(x){
    return 1 / (1 + Math.exp(-x));
}