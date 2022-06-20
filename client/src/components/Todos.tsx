import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader
} from 'semantic-ui-react'

import { createTodo, deleteTodo, getTodos, patchTodo } from '../api/todos-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'
import './styles.css';


interface TodosProps {
  auth: Auth
  history: History
}

interface TodosState {
  todos: Todo[]
  newTodoName: string
  isLoading: boolean
  page: number
  filter: string
}

interface IExampleComponentProps {

}

interface IExampleComponentState {
  page: number;
}
export class Todos extends React.PureComponent<TodosProps, TodosState>  {
  state: TodosState = {
    todos: [],
    newTodoName: '',
    isLoading: false,
    page: 1,
    filter: "",
  }
  componentDidMount() {
    this.loadUsers();
  }

  componentDidUpdate(prevProps: IExampleComponentProps, prevState: IExampleComponentState) {
    if (prevState.page !== this.state.page) {
      this.loadUsers();
    }
  }


  loadUsers = async () => {
    const { page } = this.state;

    this.setState({ isLoading: true });
    try {
      const results = await getTodos(this.props.auth.getIdToken(), page, 2);
      this.setState((prevState) => ({
        todos: [...prevState.todos, ...results],

      }));
    } catch (e) {
      let errorMessage = "Failed to fetch todos";
      if (e instanceof Error) {
        errorMessage = e.message
      }
      alert(`Failed to fetch todos: ${errorMessage}`)
    }
    finally {
      this.setState({ isLoading: false });
    }
  };

  loadMore = () => {
    this.setState((prevState) => ({
      page: prevState.page + 1
    }));
  };

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value })
  }

  onEditButtonClick = (todoId: string) => {
    this.props.history.push(`/todos/${todoId}/edit`)
  }

  onTodoCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const dueDate = this.calculateDueDate()
      const newTodo = await createTodo(this.props.auth.getIdToken(), {
        name: this.state.newTodoName.trim(),
        dueDate
      })
      this.setState({
        todos: [...this.state.todos, newTodo],
        newTodoName: ''
      })
    } catch {
      alert('Todo creation failed, pls check your input data')
    }
  }

  onTodoDelete = async (todoId: string) => {
    try {
      await deleteTodo(this.props.auth.getIdToken(), todoId)
      this.setState({
        todos: this.state.todos.filter(todo => todo.todoId !== todoId)
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onTodoCheck = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      })
    } catch {
      alert('Todo update todo check failed')
    }
  }

  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ filter: event.target.value })
  }

  render() {
    const { todos, filter, isLoading } = this.state;
    const lowercasedFilter = filter.toLowerCase();

    const filteredData = todos.filter(item => {
      return item.name.toLowerCase().includes(lowercasedFilter);
    });

    return (
      <div>
        <Header as="h1">TODOs</Header>

        {this.renderCreateTodoInput()}

        <Input
          value={filter}
          action={{
            color: 'red',
            labelPosition: 'left',
            icon: 'search',
            content: 'Search',
          }}
          fluid
          actionPosition="left"
          placeholder="Filter by name...."
          onChange={this.handleChange}
        />

        {
          (isLoading) ?
            this.renderLoading() :
            <Grid padded>
              {
                this.renderTodosList(filteredData)
              }
            </Grid>
        }


        <div className="load-more">
          <button onClick={this.loadMore} className="btn-grad">
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      </div>
    )
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TODOs
        </Loader>
      </Grid.Row>
    )
  }

  renderTodosList(todos: Todo[]) {
    return (
      todos.map((todo, pos) => {
        return (
          <Grid.Row key={todo.todoId}>
            <Grid.Column width={1} verticalAlign="middle">
              <Checkbox
                onChange={() => this.onTodoCheck(pos)}
                checked={todo.done}
              />
            </Grid.Column>
            <Grid.Column width={10} verticalAlign="middle">
              {todo.name}
            </Grid.Column>
            <Grid.Column width={3} floated="right">
              {todo.dueDate}
            </Grid.Column>
            <Grid.Column width={1} floated="right">
              <Button
                icon
                color="blue"
                onClick={() => this.onEditButtonClick(todo.todoId)}
              >
                <Icon name="pencil" />
              </Button>
            </Grid.Column>
            <Grid.Column width={1} floated="right">
              <Button
                icon
                color="red"
                onClick={() => this.onTodoDelete(todo.todoId)}
              >
                <Icon name="delete" />
              </Button>
            </Grid.Column>
            {todo.attachmentUrl && (
              <Image src={todo.attachmentUrl} size="small" wrapped />
            )}
            <Grid.Column width={16}>
              <Divider />
            </Grid.Column>
          </Grid.Row>
        )
      })

    )
  }


  renderCreateTodoInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'New task',
              onClick: this.onTodoCreate
            }}
            fluid
            actionPosition="left"
            placeholder="To change the world..."
            onChange={this.handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }






  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
