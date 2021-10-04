const lineReader = require('line-reader')
const fs = require('fs')
const path = require('path')

let infilePath = process.argv[2]
let outfilePath = path.join(
    path.dirname(infilePath),
    path.basename(infilePath, path.extname(infilePath)) + '.jsonl'
)
let rs = fs.createReadStream(infilePath)
let ws = fs.createWriteStream(outfilePath)

const lineContentRegex = /^(?:  )?([A-Za-z]+):\s*(.+)$/
const reviewsRegex = /^    ([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})\s+cutomer:\s+([A-Z0-9]+?)\s+rating:\s+([1-5])\s+votes:\s+([0-9]+?)\s+helpful:\s+([0-9]+)$/
let inBlock = ''
let record = {}

lineReader.eachLine(rs, (line, last, cb) => {

    if (line === '') {
        if (Object.keys(record).length > 0) {
            ws.write(JSON.stringify(record))
            ws.write('\r\n')
            record = {}
        }
        cb()
        return
    }

    let lineContent = line.match(lineContentRegex)
    
    if (lineContent && lineContent.length === 3) {
        inBlock = ''
        if (lineContent[1] === 'categories') {
            inBlock = 'categories'
        } else if (lineContent[1] === 'reviews') {
            inBlock = 'reviews'
        } else if (lineContent[1] === 'similar') {
            record.similar = lineContent[2].split('  ').slice(1)
        } else if (lineContent[1] === 'Id') {
            record._key = lineContent[2]
        } else if (lineContent[1] === 'salesrank') {
            record.salesrank = lineContent[2] | 0
        } else {
            record[lineContent[1]] = lineContent[2]
        }
    } else {
        if (inBlock === 'categories') {
            record.categories = line.split('|').slice(1)
        } else if (inBlock === 'reviews') {
            let review = line.match(reviewsRegex)
            if (!review) {
                console.log('does not match: ' + line)
            } else {
                let date = review[1] + '-' + review[2].padStart(2, '0') + '-' + review[3].padStart(2, '0')
                if (!record.reviews) {
                    record.reviews = []
                }
                record.reviews.push({
                    date,
                    customer: review[4],
                    rating: review[5] | 0,
                    votes: review[6] | 0,
                    helpful: review[7] | 0
                })
            }
        }
    }
    
    if (last) {
        rs.close()
        ws.close()
    }
    cb()
})