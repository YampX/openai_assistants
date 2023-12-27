// Importa y configura dotenv
import dotenv from 'dotenv';
dotenv.config();
import OpenAIAPI from 'openai';

const openai = new OpenAIAPI();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createThread = async () => {
  return openai.beta.threads.create();
};

const createUserMessage = async (threadId, content) => {
  return openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: content,
  });
};

const createRun = async (threadId) => {
  return openai.beta.threads.runs.create(threadId, {
    assistant_id: process.env.ASSISTANT_ID,
  });
};

const checkStatusAndPrintMessages = async (threadId, runId) => {
  try {
    let runStatus;
    do {
      await delay(1000); // Espera 1 segundo antes de verificar el estado nuevamente
      runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
    } while (runStatus.status !== 'completed');

    const messages = await openai.beta.threads.messages.list(threadId);
    
    // messages.data.forEach((msg) => {
    //   const role = msg.role;
    //   console.log(role);
    //   const content = msg.content[0].text.value;
    //   console.log(`${role.charAt(0).toUpperCase() + role.slice(1)}: ${content}`);
    // });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

const main = async () => {
  try {
    const thread = await createThread();
    const userMessage = await createUserMessage(thread.id, 'que servicios prestan?');
    const run = await createRun(thread.id);
    await checkStatusAndPrintMessages(thread.id, run.id);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

main();
