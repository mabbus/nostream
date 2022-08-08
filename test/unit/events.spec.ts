import { expect } from 'chai'
import { Event, CanonicalEvent } from '../../src/types/event'
import { isEventMatchingFilter, isEventSignatureValid, serializeEvent } from '../../src/utils/event'
import { EventKinds } from '../../src/constants/base'

describe('serializeEvent', () => {
  it('returns serialized event given a Nostr event', () => {
    const event: Partial<Event> = {
      pubkey: 'pubkey',
      created_at: 1000,
      kind: EventKinds.TEXT_NODE,
      tags: [['tag name', 'tag content']],
      content: 'content',
    }

    const expected: CanonicalEvent = [
      0,
      'pubkey',
      1000,
      EventKinds.TEXT_NODE,
      [['tag name', 'tag content']],
      'content',
    ]

    expect(serializeEvent(event)).to.eqls(expected)
  })
})

describe('isEventMatchingFilter', () => {
  let event: Event

  beforeEach(() => {
    event = {
      id: '6b3cdd0302ded8068ad3f0269c74423ca4fee460f800f3d90103b63f14400407',
      pubkey:
        '22e804d26ed16b68db5259e78449e96dab5d464c8f470bda3eb1a70467f2c793',
      created_at: 1648351380,
      kind: 1,
      tags: [
        [
          'p',
          '8355095016fddbe31fcf1453b26f613553e9758cf2263e190eac8fd96a3d3de9',
          'wss://nostr-pub.wellorder.net',
        ],
        [
          'e',
          '7377fa81fc6c7ae7f7f4ef8938d4a603f7bf98183b35ab128235cc92d4bebf96',
          'wss://nostr-relay.untethr.me',
        ],
      ],
      content:
        "I've set up mirroring between relays: https://i.imgur.com/HxCDipB.png",
      sig: 'b37adfed0e6398546d623536f9ddc92b95b7dc71927e1123266332659253ecd0ffa91ddf2c0a82a8426c5b363139d28534d6cac893b8a810149557a3f6d36768',
    }
  })

  it('returns true if filter is empty', () => {
    expect(isEventMatchingFilter({})(event)).to.be.true
  })

  describe('ids filter', () => {
    it('returns false if ids filter is empty', () => {
      expect(isEventMatchingFilter({ ids: [] })(event)).to.be.false
    })

    it('returns true if ids filter contains event id', () => {
      expect(isEventMatchingFilter({ ids: [event.id] })(event)).to.be.true
    })

    it('returns false if ids filter does not contains event id', () => {
      expect(isEventMatchingFilter({ ids: ['something else'] })(event)).to.be
        .false
    })
  })

  describe('authors filter', () => {
    it('returns false if authors filter is empty', () => {
      expect(isEventMatchingFilter({ authors: [] })(event)).to.be.false
    })

    it('returns true if authors filter contains event id', () => {
      expect(isEventMatchingFilter({ authors: [event.pubkey] })(event)).to.be
        .true
    })

    it('returns false if authors filter does not contains event id', () => {
      expect(isEventMatchingFilter({ authors: ['something else'] })(event)).to
        .be.false
    })
  })

  describe('kinds filter', () => {
    it('returns false if kinds filter is empty', () => {
      expect(isEventMatchingFilter({ kinds: [] })(event)).to.be.false
    })

    it('returns true if kinds filter contains event id', () => {
      expect(isEventMatchingFilter({ kinds: [event.kind] })(event)).to.be.true
    })

    it('returns false if kinds filter does not contains event id', () => {
      expect(isEventMatchingFilter({ kinds: [666] })(event)).to.be.false
    })
  })

  describe('since filter', () => {
    it('returns true if since < event created at', () => {
      expect(isEventMatchingFilter({ since: event.created_at - 1 })(event)).to
        .be.true
    })

    it('returns true if since = event created at', () => {
      expect(isEventMatchingFilter({ since: event.created_at })(event)).to.be
        .true
    })

    it('returns false if since > event created at', () => {
      expect(isEventMatchingFilter({ since: event.created_at + 1 })(event)).to
        .be.false
    })
  })

  describe('until filter', () => {
    it('returns false if until < event created at', () => {
      expect(isEventMatchingFilter({ until: event.created_at - 1 })(event)).to
        .be.false
    })

    it('returns true if until = event created at', () => {
      expect(isEventMatchingFilter({ until: event.created_at })(event)).to.be
        .true
    })

    it('returns true if until > event created at', () => {
      expect(isEventMatchingFilter({ until: event.created_at + 1 })(event)).to
        .be.true
    })
  })

  describe('#e filter', () => {
    it('returns false if #e filter is empty', () => {
      expect(isEventMatchingFilter({ '#e': [] })(event)).to.be.false
    })

    it('returns true if #e filter contains e tag in event', () => {
      expect(isEventMatchingFilter({ '#e': [event.tags[1][1]] })(event)).to.be
        .true
    })

    it('returns false if #e filter does not contain tag in event', () => {
      expect(isEventMatchingFilter({ '#e': ['something else'] })(event)).to.be
        .false
    })
  })

  describe('#p filter', () => {
    it('returns false if #p filter is empty', () => {
      expect(isEventMatchingFilter({ '#p': [] })(event)).to.be.false
    })

    it('returns true if #p filter contains p tag in event', () => {
      expect(isEventMatchingFilter({ '#p': [event.tags[0][1]] })(event)).to.be
        .true
    })

    it('returns false if #p filter does not contain tag in event', () => {
      expect(isEventMatchingFilter({ '#p': ['something else'] })(event)).to.be
        .false
    })
  })

  describe('#r filter', () => {
    beforeEach(() => {
      event = {
        id: 'cf8de9db67a1d7203512d1d81e6190f5e53abfdc0ac90275f67172b65a5b09a0',
        pubkey:
          'e8b487c079b0f67c695ae6c4c2552a47f38adfa2533cc5926bd2c102942fdcb7',
        created_at: 1645030752,
        kind: 1,
        tags: [['r', 'https://fiatjaf.com']],
        content: 'r',
        sig: '53d12018d036092794366283eca36df4e0cabd014b6e91bbf684c8bb9bbbe9dedafa77b6b928587e11e05e036227598dded8713e8da17d55076e12242b361542',
      }
    })

    it('returns false if #r filter is empty', () => {
      expect(isEventMatchingFilter({ '#r': [] })(event)).to.be.false
    })

    it('returns true if #r filter contains p tag in event', () => {
      expect(isEventMatchingFilter({ '#r': [event.tags[0][1]] })(event)).to.be
        .true
    })

    it('returns false if #r filter does not contain tag in event', () => {
      expect(isEventMatchingFilter({ '#r': ['something else'] })(event)).to.be
        .false
    })
  })
})

describe('isEventSignatureValid', () => {
  let event: Event

  beforeEach(() => {
    event = {
      'id': 'b1601d26958e6508b7b9df0af609c652346c09392b6534d93aead9819a51b4ef',
      'pubkey': '22e804d26ed16b68db5259e78449e96dab5d464c8f470bda3eb1a70467f2c793',
      'created_at': 1648339664,
      'kind': 1,
      'tags': [],
      'content': 'learning terraform rn!',
      'sig': 'ec8b2bc640c8c7e92fbc0e0a6f539da2635068a99809186f15106174d727456132977c78f3371d0ab01c108173df75750f33d8e04c4d7980bbb3fb70ba1e3848'
    }
  })

  it('resolves with true if event has a valid signature', async () => {
    expect(
      await isEventSignatureValid(event)
    ).to.be.true
  })

  it('resolves with false if event has a valid signature', async () => {
    event.id = '1234567890123456789012345678901234567890123456789012345678901234'

    expect(
      await isEventSignatureValid(event)
    ).to.be.false
  })
})