import { Bytes } from "@graphprotocol/graph-ts";
import {
  FileRegistered as FileRegisteredEvent,
  FileShared as FileSharedEvent
} from "../generated/FileRegistry/FileRegistry";

import { File, Share } from "../generated/schema";

export function handleFileRegistered(event: FileRegisteredEvent): void {
  let id = event.params.fileId.toHexString();

  let file = new File(id);
  file.owner = event.params.owner;
  file.cid = event.params.cid.toString();
  file.metadataCid = event.params.metadataCid.toString();
  file.ownerKeyChunks = event.params.ownerKeyChunks.map<Bytes>((c) => c);
  file.createdAt = event.block.timestamp;

  file.save();
}


export function handleFileShared(event: FileSharedEvent): void {
  let shareId =
    event.params.fileId.toHexString() +
    "-" +
    event.params.recipient.toHexString();

  let share = new Share(shareId);
  share.file = event.params.fileId.toHexString();
  share.owner = event.params.owner;
  share.recipient = event.params.recipient;
  share.keyChunks = event.params.keyChunksForRecipient.map<Bytes>((c) => c);
  share.timestamp = event.block.timestamp;
  share.save();
}
