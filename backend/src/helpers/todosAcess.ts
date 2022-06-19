import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
var AWSXRay = require('aws-xray-sdk');

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class TodosAccess {
    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly todoCreatedIndex = process.env.TODOS_CREATED_AT_INDEX
    ) {
    }

    async getAllTodos(userId: string): Promise<TodoItem[]> {

        logger.info('Get all todos');

        const result = await this.docClient.query({
            TableName: this.todosTable,
            IndexName: this.todoCreatedIndex,
            KeyConditionExpression: 'userId = :pk',
            ExpressionAttributeValues: {
                ':pk': userId
            }
        }).promise();

        const items = result.Items;
        return items as TodoItem[]
    }

    async createTodo(item: TodoItem): Promise<TodoItem> {

        logger.info('Create new todo');

        await this.docClient.put({
            TableName: this.todosTable,
            Item: item
        }).promise();

        return item;
    }

    async updateTodo(todoId: string, userId: string, item: TodoUpdate): Promise<TodoUpdate> {
        logger.info('Update todo');

        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                todoId: todoId,
                userId: userId,
            },
            UpdateExpression: 'set #todo_name = :name, dueDate = :dueDate, done = :done',
            ExpressionAttributeNames: {
                '#todo_name': 'name',
            },
            ExpressionAttributeValues: {
                ':name': item.name,
                ':dueData': item.dueDate,
                ':done': item.done,
            }
        }).promise();

        return item;
    }

    async deleteTodo(todoId: string, userId: string) {
        logger.info('Delete todo');

        await this.docClient.delete({
            TableName: this.todosTable,
            Key: {
                todoId: todoId,
                userId: userId
            }
        }, (err) => {
            if (err) {
                throw new Error("Delete fail")
            }
        }
        ).promise();
    }
}

function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
        console.log('Creating a local DynamoDB instance')
        return new XAWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        });
    }

    return new XAWS.DynamoDB.DocumentClient();
}
