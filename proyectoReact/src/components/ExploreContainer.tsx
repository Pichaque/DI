import './ExploreContainer.css';

const ExploreContainer: React.FC = () => {
  return (
    <div id="container">
      <strong>Ready to create an app?</strong>
      <p>
        Start with Ionic{' '}
        <a target="_blank" rel="noopener noreferrer" href="https://ionicframework.com/docs/components">
          UI Components
        </a>
      </p>
      <p> <img src="/Reacts.webp" alt="React Logo" /></p>
            <table  border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Columna 1</th>
            <th>Columna 2</th>
            <th>Columna 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Fila 1, Dato 1</td>
            <td>Fila 1, Dato 2</td>
            <td>Fila 1, Dato 3</td>
          </tr>
          <tr>
            <td>Fila 2, Dato 1</td>
            <td>Fila 2, Dato 2</td>
            <td>Fila 2, Dato 3</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ExploreContainer;
