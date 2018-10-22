import "./index.scss";

import { Component, render } from "inferno";

function str2uint(str: string): number {
  const n = parseInt(str);
  if (isNaN(n)) {
    return 0;
  }
  return n;
}

function deepEquals(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

interface ScoringParameters {
  baseValue: number;
  bonusThreshold: number;
  bonusValue: number;
}

function newScoringParameters(): ScoringParameters {
  return {
    baseValue: 20,
    bonusThreshold: 8,
    bonusValue: 20,
  };
}

interface Player {
  name: string;
  multipliers: number[];
  cardSets: number[][];
}

function newPlayer(name: string): Player {
  return {
    name,
    multipliers: [0, 0, 0, 0, 0],
    cardSets: [[], [], [], [], []],
  };
}

function cardSetScore(
  scoringParameters: ScoringParameters,
  multiplier: number,
  cardSet: number[],
): number {
  if (multiplier === 0 && cardSet.length === 0) {
    return 0;
  }
  let total = cardSet.reduce((a, b) => a + b, 0);
  total -= scoringParameters.baseValue;
  total *= multiplier + 1;
  if (multiplier + cardSet.length >= scoringParameters.bonusThreshold) {
    total += scoringParameters.bonusValue;
  }
  return total;
}

function playerScore(scoringParameters: ScoringParameters, player: Player): number {
  let score = 0;
  for (let i = 0; i < player.multipliers.length; i++) {
    score += cardSetScore(scoringParameters, player.multipliers[i], player.cardSets[i]);
  }
  return score;
}

interface NumberListInputProps {
  numbers: number[];
  onNumbersInput: (numbers: number[]) => void;
}

interface NumberListInputState {
  value: string;
}

class NumberListInput extends Component<NumberListInputProps, NumberListInputState> {
  public state: NumberListInputState = {
    value: "",
  };

  constructor(props: NumberListInputProps, context: null) {
    super(props, context);
  }

  public componentWillReceiveProps(nextProps: NumberListInputProps) {
    const numbers = this.str2numberList(this.state.value);
    if (!deepEquals(nextProps.numbers, numbers)) {
      this.setState({ value: nextProps.numbers.join(" ") });
    }
  }

  public render() {
    return (
      <input
        class="input"
        type="text"
        value={this.state.value}
        onInput={e => {
          const value = e.currentTarget.value;
          if (!/^(\s|[0-9]+)*$/.test(value)) {
            return;
          }
          this.setState({ value });
          const numbers = this.str2numberList(value);
          if (!deepEquals(this.props.numbers, numbers)) {
            this.props.onNumbersInput(numbers);
          }
        }}
      />
    );
  }

  private str2numberList(s: string): number[] {
    let numbers = [];
    if (s.length > 0) {
      numbers = s
        .replace(/\s\s+/g, " ")
        .trim()
        .split(" ")
        .map(str2uint);
    }
    return numbers;
  }
}

function CardSet(props: {
  scoringParameters: ScoringParameters;
  multiplier: number;
  cardSet: number[];
  setMultiplier: (multiplier: number) => void;
  setCardSet: (cardSet: number[]) => void;
}) {
  const score = cardSetScore(props.scoringParameters, props.multiplier, props.cardSet);
  return (
    <div class="field has-addons is-fullwidth">
      <p class="control">
        <span class="select">
          <select
            value={props.multiplier}
            onChange={e => {
              props.setMultiplier(str2uint(e.currentTarget.value));
            }}
          >
            <option value={0}>0</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </span>
      </p>
      <p class="control" style={{ width: "100%" }}>
        <NumberListInput numbers={props.cardSet} onNumbersInput={props.setCardSet} />
      </p>
      <p class="control">
        <a class="button is-static">{score}</a>
      </p>
    </div>
  );
}

function PlayerComp(props: {
  scoringParameters;
  player: Player;
  setPlayer: (player: Player) => void;
}) {
  const scoringParameters = props.scoringParameters;
  const { name, multipliers, cardSets } = props.player;
  let score = 0;
  for (let i = 0; i < multipliers.length; i++) {
    score += cardSetScore(scoringParameters, multipliers[i], cardSets[i]);
  }
  return (
    <div>
      <h1 class="is-size-4">{`${name} Score: ${score}`}</h1>
      {multipliers.map((m, i) => (
        <CardSet
          scoringParameters={scoringParameters}
          multiplier={m}
          cardSet={cardSets[i]}
          setMultiplier={(multiplier: number) => {
            const ms = multipliers.slice();
            ms[i] = multiplier;
            props.setPlayer({ name, cardSets, multipliers: ms });
          }}
          setCardSet={(cardSet: number[]) => {
            const cs = cardSets.slice();
            cs[i] = cardSet;
            props.setPlayer({ name, multipliers, cardSets: cs });
          }}
        />
      ))}
    </div>
  );
}

interface AppState {
  scoringParameters: ScoringParameters;
  player1: Player;
  player2: Player;
}

class App extends Component<{}, {}> {
  public state: AppState = {
    scoringParameters: newScoringParameters(),
    player1: newPlayer("Player 1"),
    player2: newPlayer("Player 2"),
  };

  constructor(props: null, context: null) {
    super(props, context);
  }

  public render() {
    const { scoringParameters, player1, player2 } = this.state;
    const player1Score = playerScore(scoringParameters, player1);
    const player2Score = playerScore(scoringParameters, player2);
    let resultText = `Its a tie! ${player1Score} to ${player2Score}`;
    if (player1Score > player2Score) {
      resultText = `${player1.name} wins! ${player1Score} to ${player2Score}`;
    } else if (player2Score > player1Score) {
      resultText = `${player2.name} wins! ${player2Score} to ${player1Score}`;
    }
    return (
      <div class="container">
        <h1 class="is-size-1">Lost Cities</h1>
        <h1 class="is-size-4">Scoring Parameters</h1>
        <div class="field is-horizontal">
          <div class="field-label is-normal">
            <label class="label">Base Value</label>
          </div>
          <div class="field-body">
            <div class="field">
              <input
                type="text"
                class="input"
                value={scoringParameters.baseValue}
                onInput={e => {
                  const baseValue = str2uint(e.currentTarget.value);
                  this.setState({
                    scoringParameters: { ...scoringParameters, baseValue },
                  });
                }}
              />
            </div>
          </div>
        </div>
        <div class="field is-horizontal">
          <div class="field-label is-normal">
            <label class="label">Bonus Threshold</label>
          </div>
          <div class="field-body">
            <div class="field">
              <input
                type="text"
                class="input"
                value={scoringParameters.bonusThreshold}
                onInput={e => {
                  const bonusThreshold = str2uint(e.currentTarget.value);
                  this.setState({
                    scoringParameters: { ...scoringParameters, bonusThreshold },
                  });
                }}
              />
            </div>
          </div>
        </div>
        <div class="field is-horizontal">
          <div class="field-label is-normal">
            <label class="label">Bonus Value</label>
          </div>
          <div class="field-body">
            <div class="field">
              <input
                type="text"
                class="input"
                value={scoringParameters.bonusValue}
                onInput={e => {
                  const bonusValue = str2uint(e.currentTarget.value);
                  this.setState({
                    scoringParameters: { ...scoringParameters, bonusValue },
                  });
                }}
              />
            </div>
          </div>
        </div>

        <PlayerComp
          scoringParameters={scoringParameters}
          player={player1}
          setPlayer={(player: Player) => {
            this.setState({ player1: player });
          }}
        />
        <PlayerComp
          scoringParameters={scoringParameters}
          player={player2}
          setPlayer={(player: Player) => {
            this.setState({ player2: player });
          }}
        />
        <div class="level">
          <h1 class="level-item is-size-3">{resultText}</h1>
          <input
            type="button"
            class="button is-primary"
            value="Reset"
            onClick={() => {
              this.setState({
                player1: newPlayer(player1.name),
                player2: newPlayer(player2.name),
              });
            }}
          />
        </div>
      </div>
    );
  }
}

// Main
document.addEventListener("DOMContentLoaded", () => {
  // Render the app
  render(<App />, document.getElementById("root"));

  // Add navbar burger toggle
  // Get all "navbar-burger" elements
  const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll(".navbar-burger"), 0);
  if ($navbarBurgers.length > 0) {
    // Add a click event on each of them
    $navbarBurgers.forEach($el => {
      $el.addEventListener("click", () => {
        // Get the target from the "data-target" attribute
        const target = $el.dataset.target;
        const $target = document.getElementById(target);

        // Toggle the class on both the "navbar-burger" and the "navbar-menu"
        $el.classList.toggle("is-active");
        $target.classList.toggle("is-active");
      });
    });
  }

  // Add the favicon
  const docHead = document.getElementsByTagName("head")[0];
  const newLink = document.createElement("link");
  newLink.rel = "shortcut icon";
  //   newLink.href = ICON;
  docHead.appendChild(newLink);
});
