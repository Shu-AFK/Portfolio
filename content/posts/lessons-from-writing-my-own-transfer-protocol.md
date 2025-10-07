---
title: Lessons From Writing My Own Transfer Protocol (So You Don’t Have To)
date: 05.10.2025
tags:
- networking
- sockets
- c++
- lessons-learned
description: "A deep-dive into building a custom client-server transfer protocol in C++ with raw sockets—what worked, what broke, and why I’d choose HTTP next time."
keywords:
- "custom transfer protocol"
- "socket programming"
- "C++ networking"
- "LZ4 compression"
- "Datatransmission project"
- "client server communication"
- "network protocol design"
coverImage: "/blog-images/datatransmission-cover.jpg"
---


## First, why did I even write Datatransmission? And what is it, anyway?

I first learned about sockets by reading the Windows API documentation.  
At some point I thought: instead of just reading, why not build something with it?

Because I’m interested in cybersecurity, my mind went straight to remote-access tools.  
I wondered how a very simple one might work, so without doing any research beforehand, I started coding.  
That experiment eventually became **Datatransmission**.

So, what is Datatransmission?  
It’s a small **client–server application** that lets you:

- Connect to multiple servers at the same time
- Send commands to those servers and get the output back
- Upload and download files, etc.

While the server is able to handle multiple client connections simultaneously.

Of course, the client and server need a way to talk to each other.  
Instead of using a proven transfer protocol like HTTP… I decided to invent my own.  
Why? Honestly, only God knows.


## How I Designed the Protocol

I didn’t use HTTP.  
Instead, I created a very simple byte-based protocol where a few special markers control how the client and server talk to each other.

### Message Markers

| Marker | Meaning                                                         |
|--------|-----------------------------------------------------------------|
| `\f`   | End of a message                                                |
| `\v\v` | Start of a file-transfer block                                  |
| `\r`   | Flag that the following file-block is **compressed**            |
| sizes  | 8-byte original size + 8-byte compressed size (sent after `\r`) |

A normal command looks like:

```
[command bytes ...][ \f ]
```

A file transfer looks like:

```
[ \v\v ][ \r? ][original-size][compressed-size][file-data][ \f ]
```

### Sending a Simple Command

```cpp
int Client::sendData(SOCKET sock, std::string cmd) {
    cmd += '\f';                 // add end-of-message marker
    send(sock, cmd.c_str(), (int)cmd.length(), 0);
}
```

The **`\f`** tells the server “this message is complete”.

### Receiving Until the End Marker

```cpp
std::string Client::recvData(SOCKET sock) {
    std::string ret;
    char c;
    while (recv(sock, &c, 1, 0) > 0) {
        if (c == '\f') break;    // reached end of message
        ret += c;
    }
    return ret;
}
```

The client reads one byte at a time until it finds **`\f`**.

### Handling File Transfers

Large files are compressed with **LZ4** and marked with **`\r`**:

```cpp
if (isLargeFile) {
    file_contents.insert(0, "\r");          // compression flag
    // append sizes + compressed data
}
file_contents.insert(0, "\v\v");            // file-transfer start
file_contents += '\f';                      // end marker
send(sock, file_contents.c_str(), file_contents.size(), 0);
```

### Why It’s Hard to Maintain

At the time I thought these markers were “simple enough”.  
But the markers are unintuitive and hard to keep on adding to, making it hard to add new features.


## Challenges I Hit

Building the protocol was exciting at first, until I actually had to extend it.

- **Byte-by-byte reads slowed everything down.**  
  Reading one character at a time until `\f` worked in theory, but it was inefficient and easy to mess up.

- **Markers everywhere, no structure.**  
  With each new feature I invented another special character (`\v`, `\r`, ...).  
  The more I added, the harder it was to remember what each one meant.

- **Compression wasn’t free.**  
  LZ4 sped up large file transfers, but it added size fields, flags, and new failure modes I hadn’t planned for.

- **No written spec.**  
  I thought I’d remember the details, future-me did not.  
  I had to reverse-engineer my own code just to figure out how things were supposed to work.


## What I Learned

Looking back, the project was fun, but I’d approach it differently next time.

- **If you roll your own protocol, define a proper packet format.**
  Instead of inventing random marker characters, design a clear packet layout with binary-encoded fields (like flags or length headers).
  This makes messages easier to parse, extend, and debug when you add new features.

- **Log everything.**  
  Debugging a silent network failure is misery without good logs.

- **Stick to existing protocols unless you have a good reason not to.**  
  HTTP, WebSocket, or even a simple JSON-over-TCP would have been far easier to extend and debug.

- **Plan for growth.**  
  Improvised markers like `\f` and `\v\v` don’t scale when you start adding new features.


## Closing Thoughts

Building [**Datatransmission**](https://github.com/Shu-AFK/Datatransmission) taught me that even “simple” networking projects are never really simple.  
Rolling my own protocol was a valuable learning experience, but not something I’d recommend for production software.

If you’re curious about sockets, I still encourage building something from scratch,
just remember to document your protocol, or better yet, start with an existing one like HTTP and add plenty of logging.
Future-you will thank you.
