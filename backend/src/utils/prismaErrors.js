function mapPrismaError(error) {
  switch (error.code) {
    case 'P2002':
      return { status: 409, message: 'A record with this value already exists' };
    case 'P2025':
      return { status: 404, message: 'Record not found' };
    case 'P2003':
      return { status: 400, message: 'Invalid reference — related record not found' };
    default:
      if (error.message?.includes('Malformed ObjectID')) {
        return { status: 400, message: 'Invalid ID format' };
      }
      return { status: 500, message: 'Database operation failed' };
  }
}

module.exports = { mapPrismaError };
