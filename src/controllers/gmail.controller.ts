import { gmail_v1, google } from 'googleapis';
import Logger from '../loader/logger';
import { UserDoc } from '../schema/User';
import { checkAndRefreshAccessToken } from './auth.controller';
import { findAll, updateLabel } from './user.controller';

const gmail = google.gmail({ version: 'v1' });

/**
 * Fetches all the users from db and starts sending mails
 */
export const startTask = async () => {
  const users = await findAll();

  if (users.length > 0) {
    for (const user of users) {
      await sendMails(user);
    }
  }
};

/**
 * For each user, finds their threads, filters them, sends them replies and adds labels
 */
export const sendMails = async (user: UserDoc) => {
  const threads = await fetchUserThreads(user);

  const threadsWithoutReply = filterThreadsWithoutReply(threads);

  let labelId = user.labelId || (await createLabel(user));

  const messagesId = await sendRepliesToThread(threadsWithoutReply, user);

  await modifyEmailLabels(messagesId, labelId as string, user);

  console.log(`sent mails for ${user.email}`);
};

/**
 * Fetches all the user threads
 * @param user User document
 * @returns User threads
 */
export const fetchUserThreads = async (user: UserDoc) => {
  const access_token = await checkAndRefreshAccessToken(user);

  try {
    const { data } = await gmail.users.messages.list({
      userId: 'me',
      access_token,
      includeSpamTrash: false,
      maxResults: 20,
      q: `in:inbox to:(${user.email})`,
    });

    const messages = data.messages;

    if (messages) {
      let threadPromises = [];
      let threadSet = new Set();

      for (const message of messages) {
        try {
          if (!threadSet.has(message.threadId)) {
            const threadPromise = gmail.users.threads
              .get({
                userId: 'me',
                id: message.threadId as string,
                metadataHeaders: ['To', 'From'],
                format: 'METADATA',
                access_token,
              })
              .then(({ data }) => {
                return data;
              });

            threadSet.add(message.threadId);
            threadPromises.push(threadPromise);
          }
        } catch (err) {
          console.log(err);
        }
      }
      const thread = Promise.all(threadPromises);

      return thread;
    }
  } catch (err) {
    Logger.error(err).on('error', (err) => {
      Logger.error(err);
    });
  }

  return [];
};

/**
 * Filter threads
 * @param threads
 * @returns Threads without any replies
 */
export const filterThreadsWithoutReply = (threads: gmail_v1.Schema$Thread[]) => {
  return threads.filter((thread) => {
    if (thread.messages) {
      const hasReplyFromUser = thread.messages.some((message) => {
        const userSentEmail = message.labelIds?.includes('SENT');
        return userSentEmail;
      });
      return !hasReplyFromUser;
    }
    return false;
  });
};

/**
 * Send mails to the unreplied threads
 * @param threads Filtered threads without replies
 * @param user User Document
 * @returns Message ids for the mails sent
 */
export const sendRepliesToThread = async (threads: gmail_v1.Schema$Thread[], user: UserDoc) => {
  const access_token = await checkAndRefreshAccessToken(user);

  let repliesId: string[] = [];

  for (const thread of threads) {
    if (thread.messages) {
      const message: gmail_v1.Schema$Message = {
        threadId: thread.id,
        raw: Buffer.from(
          `From: ${thread.messages[0].payload?.headers?.find((header) => header.name === 'To')?.value} \r\n` +
            `To: ${thread.messages[0].payload?.headers?.find((header) => header.name === 'From')?.value}\r\n` +
            `Subject: Automated Reply Subject\r\n` +
            `Content-Type: text/plain; charset=utf-8\r\n` +
            `\r\n` +
            `This is an automated reply`,
        ).toString('base64'),
      };

      try {
        const response = await gmail.users.messages.send({
          userId: 'me',
          requestBody: message,
          access_token,
        });

        repliesId.push(response.data.id as string);
      } catch (err) {
        Logger.error(err).on('error', (err) => {
          Logger.error(err);
        });
      }
    }
  }

  return repliesId;
};

/**
 * Creates labels if not present in document
 * @param user User document
 * @returns LabelId
 */
export const createLabel = async (user: UserDoc) => {
  const access_token = await checkAndRefreshAccessToken(user);

  try {
    const label = await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: 'AutoBot Reply',
      },
      access_token: access_token,
    });

    await updateLabel(label.data.id as string, user._id);
    console.log('label created: ', label.data);
    return label.data.id;
  } catch (err) {
    throw new Error(`Error creating label: ${err}`);
  }
};

/**
 * Move replies to custom label
 * @param messagesId Messages whose labels have to be updated
 * @param labelId Label where the messages have to be moved
 * @param user User Document
 * @returns void
 */
export const modifyEmailLabels = async (messagesId: string[], labelId: string, user: UserDoc) => {
  const access_token = await checkAndRefreshAccessToken(user);
  console.log(messagesId);

  if (messagesId.length > 0) {
    try {
      await gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: {
          ids: messagesId,
          addLabelIds: [labelId],
        },
        access_token,
      });
      return;
    } catch (err) {
      Logger.error(err);
    }
  } else {
    return;
  }
};
