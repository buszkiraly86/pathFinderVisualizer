import React from 'react';
import './PathFinder.css';

class Cell {
    
    constructor(i, j, distance) {
        this.i = i;
        this.j = j;
        this.distance = distance;
        this.fixed = false;
    }
}

class PathFinder extends React.Component {

    constructor(props) {
        super(props);
        this.props = props;
        this.startingPoint = [Math.floor(this.props.rows / 2), 8];
        this.destinationPoint = [Math.floor(this.props.rows / 2), 41];
        this.state = {
            clean: true,
            finding: false,
            board: this._generateBoard(this.props.rows, this.props.columns)
        }
    }

    _generateBoard(rows, columns) {
        const board = [];

        for (let i = 0; i < rows; ++i) {
            const row = [];

            for (let j = 0; j < columns; ++j) {

                let distance = Infinity;

                if (i === this.startingPoint[0] && j === this.startingPoint[1]) {
                    distance = 0;
                }

                row.push(new Cell(i, j, distance));
            }

            board.push(row);
        }

        return board;
    }

    async _dijkstra(board, update) {
        const frontier = [];

        const updateFrontier = (i, j, distance) => {
            if (i >= 0 && i < this.props.rows && j >= 0 && j < this.props.columns && !board[i][j].fixed && !board[i][j].wall) {
                let neighbor = board[i][j];
                if (neighbor.frontier) {
                    neighbor.distance = Math.min(neighbor.distance, distance + 1);
                } else {
                    neighbor.distance = distance + 1;
                    neighbor.frontier = true;
                    frontier.push(neighbor);
                }
            }
        }

        const fixCell = (cell) => {
            let i = cell.i;
            let j = cell.j;

            updateFrontier(i - 1, j, cell.distance);
            updateFrontier(i + 1, j, cell.distance);
            updateFrontier(i, j - 1, cell.distance);
            updateFrontier(i, j + 1, cell.distance);

            cell.fixed = true;
            cell.frontier = false;
        }

        fixCell(board[this.startingPoint[0]][this.startingPoint[1]]);

        while (frontier.length && !board[this.destinationPoint[0]][this.destinationPoint[1]].fixed) {
            let minFrontier = 0;

            for (let i = 1; i < frontier.length; ++i) {
                if (frontier[minFrontier].distance > frontier[i].distance) {
                    minFrontier = i;
                }
            }

            fixCell(frontier[minFrontier]);
            frontier.splice(minFrontier, 1);

            await new Promise(res => setTimeout(res, 10));
            update(board);
        }

        let head = board[this.destinationPoint[0]][this.destinationPoint[1]];
        while (head.i !== this.startingPoint[0] || head.j !== this.startingPoint[1]) {
            let positions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            let next = head;

            for (const position of positions) {
                const i = head.i + position[0];
                const j = head.j + position[1];

                if (i >= 0 && i < this.props.rows && j >= 0 && j < this.props.columns && board[i][j].fixed && board[i][j].distance < next.distance) {
                    next = board[i][j];
                }
            }

            if (next == head) {
                console.log("no path");
                break;
            }

            await new Promise(res => setTimeout(res, 100));
            next.path = true;
            head = next;
            update(board);
        }

    }

    async _reset() {
        const state = {
            clean: true,
            finding: false,
            board: this._generateBoard(this.props.rows, this.props.columns)
        }

        this.setState(state);
    }

    async _find() {
        const state = {...this.state}; 
        state.finding = true;
        state.clean = false;
        this.setState(state);

        await this._dijkstra([...this.state.board], (board) => {
            state.board = [...board];
            this.setState(state);
        });

        state.finding = false;
        this.setState(state);
    }

    _setWall(i, j, down) {
        if (!down) return;

        const state = {...this.state};
        state.board[i][j].wall = !state.board[i][j].wall;

        this.setState(state);
    }

    _mouseDownHandler(down, i, j) {
        const state = {...this.state}
        state.mouseDown = down;

        this._setWall(i, j, down);

        this.setState(state);
    }

    render() {
        const rows = [];

        for (let i = 0; i < this.state.board.length; ++i) {
            const row = [];
            for (let j = 0; j < this.state.board[i].length; ++j) {
                let className = "";
                const key = i * this.state.board[i].length + j;

                if (this.state.board[i][j].frontier) {
                    className = "frontier";
                }

                if (this.state.board[i][j].fixed) {
                    className = "fixed";
                }

                if (this.state.board[i][j].wall) {
                    className = "wall";
                }

                if (this.state.board[i][j].path) {
                    className = "path";
                }

                if (i === this.startingPoint[0] && j === this.startingPoint[1]) {
                    className = "startingPoint";
                }

                if (i === this.destinationPoint[0] && j === this.destinationPoint[1]) {
                    className = "destinationPoint";
                }

                row.push(
                    <td
                        onMouseDown={() => this._mouseDownHandler(true, i, j)}
                        onMouseUp={() => this._mouseDownHandler(false)}
                        onMouseEnter={() => this._setWall(i, j, this.state.mouseDown)}
                        className={className}
                        key={key}>
                    </td>); 
            }
            rows.push(
                <tr key={i}>
                    {row}
                </tr>
            );
        }

        return (
            <div className="PathFinder">
                <div className="Board">
                    <table onMouseLeave={() => this._mouseDownHandler(false)} width="500px">
                        <tbody>
                            {rows}
                        </tbody>
                    </table>
                </div>
                <div className="finderBtnRow">
                    <button className="finderBtn" disabled={this.state.finding} onClick={async () => await this._reset()}>Reset</button>
                    <button className="finderBtn" disabled={this.state.finding || !this.state.clean} onClick={async () => await this._find()}>Dijkstra</button>
                    <p>
                        walls can be erected by using the mouse
                    </p>
                </div>
            </div>
        );
    }
}

export default PathFinder;
